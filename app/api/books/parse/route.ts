import { NextResponse } from "next/server";
import { callDeepSeek, readAIConfigFromRequest } from "../../../../lib/providers/ai";

function parseJsonContent(raw: string) {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  throw new Error("model did not return valid JSON");
}

function pick(...values: unknown[]) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function normalizeResult(query: string, raw: Record<string, unknown>) {
  const title = String(pick(raw.title, query)).trim().slice(0, 200);
  const isbn = String(pick(raw.isbn, raw.isbn13, raw.isbn_13)).replace(/[^0-9Xx]/g, "").toUpperCase();
  return {
    title,
    author: String(pick(raw.author, raw.authors)).trim().slice(0, 200),
    publisher: String(pick(raw.publisher, raw.publishers)).trim().slice(0, 200),
    publishedYear: String(pick(raw.publishedYear, raw.published_year, raw.publish_year)).match(/\d{4}/)?.[0] || "",
    description: String(pick(raw.description, raw.summary, raw.introduction)).trim().slice(0, 1000),
    isbn,
    coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : "",
  };
}

async function parseWithDeepSeek(query: string, request: Request) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const d = await callDeepSeek(
        {
          model: process.env.AI_MODEL || "deepseek-v4-flash",
          temperature: 0,
          max_tokens: 1024,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "只输出JSON对象，字段值全部为字符串，不要额外解释。" },
            {
              role: "user",
              content: `请解析书籍《${query}》，返回 title, author, publisher, publishedYear, description, isbn。`,
            },
          ],
        },
        readAIConfigFromRequest(request),
        { timeoutMs: 15000 },
      );
      const raw = d.choices?.[0]?.message?.content || "{}";
      const parsed = parseJsonContent(raw) as Record<string, unknown>;
      return normalizeResult(query, parsed);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("DeepSeek parse failed");
}

export async function POST(req: Request) {
  const { query } = await req.json();
  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const result = await parseWithDeepSeek(query.trim().slice(0, 120), req);
    return NextResponse.json({
      ...result,
      message: result.coverUrl ? "解析完成，已获取封面" : "信息解析完成，封面暂未获取",
      source: "ai",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "DeepSeek 信息解析失败",
        detail: error instanceof Error ? error.message : "unknown error",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
