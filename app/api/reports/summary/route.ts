import { NextResponse } from "next/server";

async function callDeepSeek(body: Record<string, unknown>) {
  const baseUrl = (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY || process.env.OPENAI_API_KEY || ""}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`DeepSeek API ${response.status}: ${text.slice(0, 1000)}`);
  return JSON.parse(text);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rows = Array.isArray(body?.sessions) ? body.sessions : [];
    const finished = rows.filter((b: any) => b?.status === "FINISHED");
    const reading = rows.filter((b: any) => b?.status === "READING");
    let summary = `本阶段完成 ${finished.length} 次阅读，当前在读 ${reading.length} 本。`;

    try {
      const d = await callDeepSeek({
        model: body.ai?.model || process.env.AI_MODEL || "deepseek-v4-flash",
        temperature: 0.2,
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: `根据阅读会话统计生成一句中文总结：完成${finished.length}次，当前在读${reading.length}本。只返回一句话。`,
          },
        ],
      });
      if (d.choices?.[0]?.message?.content) summary = d.choices[0].message.content.trim();
    } catch {}

    return NextResponse.json({ summary, completed: finished.length, reading: reading.length, generatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Invalid report data" }, { status: 400 });
  }
}
