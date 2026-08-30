import { NextResponse } from "next/server";
import { syncBooks, syncSessions, syncArchiveExtras, supabaseConfigured } from "../../../lib/supabase-adapter";

export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ mode: "local", synced: false, reason: "Supabase 未配置" });
  try {
    const body = await request.json();
    const books = Array.isArray(body?.books) ? body.books : [];
    const sessions = Array.isArray(body?.sessions) ? body.sessions : [];
    const [bookResult, sessionResult, extraResult] = await Promise.all([syncBooks(books), syncSessions(sessions), syncArchiveExtras(body)]);
    return NextResponse.json({ mode: "supabase", synced: true, books: bookResult.count, sessions: sessionResult.count, extras: extraResult.count });
  } catch {
    return NextResponse.json({ mode: "local", synced: false, retryable: true }, { status: 503 });
  }
}

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ mode: "local", synced: false, books: [], sessions: [] });
  try {
    const { readCloudArchive } = await import("../../../lib/supabase-adapter");
    return NextResponse.json({ mode: "supabase", synced: true, ...(await readCloudArchive()) });
  } catch {
    return NextResponse.json({ mode: "local", synced: false, retryable: true }, { status: 503 });
  }
}
