import { NextResponse } from "next/server";
import { bookMetadataProvider } from "../../../../lib/providers/book-metadata";

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") || "").trim().slice(0, 120);
  if (!q) return NextResponse.json({ url: "", error: "请输入书名" }, { status: 400 });
  try {
    const results = await bookMetadataProvider.searchBooks(q);
    return NextResponse.json({ query: q, results, source: results.length ? "live" : "unavailable" });
  } catch {
    return NextResponse.json({ query: q, results: [], source: "unavailable", error: "实时搜索服务暂不可用" }, { status: 503 });
  }
}
