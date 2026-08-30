import type { ArchiveBook, ReadingSession, ProgressLog, ReadingNote, BookTopic, PosterRecord } from "./archive";

/** Optional server-side adapter. Local storage remains the default when env vars are absent. */
export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function request(path: string, init?: RequestInit) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Supabase is not configured");
  const response = await fetch(`${base.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.status === 204 ? null : response.json();
}

export async function syncBooks(books: ArchiveBook[]) {
  if (!supabaseConfigured() || !books.length) return { synced: false, count: 0 };
  await request("books?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(books.map((book) => ({ id: book.id, title: book.title, author: book.author, cover_url: book.coverUrl || null, description: book.description || null, publisher: book.publisher || null, publish_year: book.publishedYear ? Number(book.publishedYear) : null, isbn: book.isbn || null, total_pages: book.totalPages || null }))) });
  return { synced: true, count: books.length };
}

export async function syncSessions(sessions: ReadingSession[]) {
  if (!supabaseConfigured() || !sessions.length) return { synced: false, count: 0 };
  await request("reading_sessions?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(sessions.map((session) => ({ id: session.id, book_id: session.bookId, status: session.status, source: session.source, started_at: session.startedAt || null, finished_at: session.finishedAt || null, current_page: session.currentPage || null, current_chapter: session.currentChapter || null }))) });
  return { synced: true, count: sessions.length };
}

export async function syncArchiveExtras(data: { progressLogs?: ProgressLog[]; notes?: ReadingNote[]; topics?: BookTopic[]; posters?: PosterRecord[] }) {
  if (!supabaseConfigured()) return { synced: false, count: 0 };
  let count = 0;
  if (data.progressLogs?.length) { await request("progress_logs?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(data.progressLogs.map(x => ({ id:x.id, reading_session_id:x.sessionId, log_date:x.date, page_number:x.currentPage ?? null, chapter_text:x.currentChapter ?? null }))) }); count += data.progressLogs.length; }
  if (data.notes?.length) { await request("ai_reading_notes?on_conflict=reading_session_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(data.notes.map(x => ({ reading_session_id:x.sessionId, reading_notes:x.content, one_sentence_summary:x.personalInput ?? null, updated_at:x.savedAt }))) }); count += data.notes.length; }
  if (data.topics?.length) { await request("book_topics", { method: "POST", headers: { Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify(data.topics.map(x => ({ book_id:x.bookId, topic:x.topic, normalized_topic:x.normalizedTopic }))) }); count += data.topics.length; }
  if (data.posters?.length) { await request("posters", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(data.posters.map(x => ({ id:x.id, reading_session_id:x.sessionId, final_image_url:x.imageDataUrl, created_at:x.createdAt }))) }); count += data.posters.length; }
  return { synced: true, count };
}

export async function readCloudArchive() {
  const books = await request("books?select=*&order=created_at.desc");
  const sessions = await request("reading_sessions?select=*&order=created_at.desc");
  const [progressLogs, notes, topics, posters] = await Promise.all([
    request("progress_logs?select=*&order=created_at.desc"), request("ai_reading_notes?select=*&order=created_at.desc"), request("book_topics?select=*&order=generated_at.desc"), request("posters?select=*&order=created_at.desc")
  ]);
  return { books, sessions, progressLogs, notes, topics, posters };
}
