import { NextResponse } from "next/server";
import { createTextAIProvider, readAIConfigFromRequest } from "../../../../lib/providers/ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ai = createTextAIProvider(readAIConfigFromRequest(req));

    if (Array.isArray(body?.books) && body.books.length) {
      const analysis = await ai.generateTopicAnalysis({
        books: body.books
          .map((book: any) => ({
            title: String(book?.title || "").trim(),
            author: typeof book?.author === "string" ? book.author.trim() : "",
            description: typeof book?.description === "string" ? book.description.trim() : "",
          }))
          .filter((book: any) => book.title),
      });
      return NextResponse.json({ analysis, version: 1 });
    }

    if (typeof body?.title === "string" && body.title.trim()) {
      const topics = await ai.generateTopics({ title: body.title.trim(), description: typeof body.description === "string" ? body.description : undefined });
      return NextResponse.json({ topics: Array.from(new Set(topics.map((t) => t.trim()).filter(Boolean))).slice(0, 5), version: 1 });
    }

    return NextResponse.json({ error: "books or title is required" }, { status: 400 });
  } catch {
    return NextResponse.json({ analysis: null, retryable: true }, { status: 503 });
  }
}
