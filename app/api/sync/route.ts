import { NextResponse } from "next/server";
import { syncBooks, syncSessions, syncArchiveExtras, supabaseConfigured } from "../../../lib/supabase-adapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const books = Array.isArray(body?.books) ? body.books : [];
    const sessions = Array.isArray(body?.sessions) ? body.sessions : [];
    if (supabaseConfigured()) {
      const [bookResult, sessionResult, extraResult] = await Promise.all([syncBooks(books), syncSessions(sessions), syncArchiveExtras(body)]);
      return NextResponse.json({ mode: "supabase", synced: true, books: bookResult.count, sessions: sessionResult.count, extras: extraResult.count });
    }
    return NextResponse.json({ mode: "local", synced: false, retryable: true, books: books.length, sessions: sessions.length, extras: Array.isArray(body?.posters) ? body.posters.length : 0 });
  } catch {
    return NextResponse.json({ mode: "local", synced: false, retryable: true }, { status: 503 });
  }
}

export async function GET() {
  try {
    if (supabaseConfigured()) {
      const { readCloudArchive } = await import("../../../lib/supabase-adapter");
      const cloud = await readCloudArchive();
      return NextResponse.json({ mode: "supabase", synced: true, ...cloud });
    }
    return NextResponse.json({ mode: "local", synced: false, retryable: true });
  } catch {
    return NextResponse.json({ mode: "local", synced: false, retryable: true }, { status: 503 });
  }
}
