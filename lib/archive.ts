export type ReadingStatus = "WANT_TO_READ" | "READING" | "FINISHED" | "PAUSED";
export type ReadingSource = "WECHAT_READING" | "KINDLE" | "PAPER" | "OTHER";

export interface ArchiveBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  publisher?: string;
  publishedYear?: string;
  isbn?: string;
  totalPages?: number;
  createdAt: string;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  status: ReadingStatus;
  source: ReadingSource;
  startedAt?: string;
  finishedAt?: string;
  currentPage?: number;
  currentChapter?: string;
  createdAt: string;
}

export interface ProgressLog {
  id: string;
  sessionId: string;
  date: string;
  currentPage?: number;
  currentChapter?: string;
}

export interface ReadingNote {
  sessionId: string;
  content: string;
  personalInput?: string;
  savedAt: string;
}

export interface BookTopic { bookId: string; topic: string; normalizedTopic: string }
export interface PosterRecord { id: string; sessionId: string; imageDataUrl: string; createdAt: string }

export interface ArchiveData {
  version: 2;
  books: ArchiveBook[];
  sessions: ReadingSession[];
  progressLogs: ProgressLog[];
  notes: ReadingNote[];
  topics: BookTopic[];
  posters: PosterRecord[];
}

export interface AddReadingInput {
  title: string;
  author?: string;
  coverUrl?: string;
  description?: string;
  publisher?: string;
  publishedYear?: string;
  isbn?: string;
  totalPages?: number;
  status: ReadingStatus;
  source?: ReadingSource;
  startedAt?: string;
  finishedAt?: string;
}

export const ARCHIVE_KEY = "reading-archive-v2";
export const today = () => new Date().toISOString().slice(0, 10);
export const createEmptyArchive = (): ArchiveData => ({ version: 2, books: [], sessions: [], progressLogs: [], notes: [], topics: [], posters: [] });

const normalize = (value = "") => value.toLocaleLowerCase().replace(/[\s《》〈〉「」『』·•:：,，.。\-—_]/g, "");

export function findExistingBook(data: ArchiveData, input: Pick<AddReadingInput, "isbn" | "title" | "author">) {
  if (input.isbn) {
    const isbn = input.isbn.replace(/[^0-9X]/gi, "").toUpperCase();
    const byIsbn = data.books.find((book) => book.isbn?.replace(/[^0-9X]/gi, "").toUpperCase() === isbn);
    if (byIsbn) return byIsbn;
  }
  const title = normalize(input.title);
  const author = normalize(input.author);
  return data.books.find((book) => normalize(book.title) === title && (!author || normalize(book.author) === author));
}

export function addReading(data: ArchiveData, input: AddReadingInput, sessionId = crypto.randomUUID(), bookId = crypto.randomUUID()): ArchiveData {
  const existing = findExistingBook(data, input);
  const now = new Date().toISOString();
  const book: ArchiveBook = existing ? { ...existing, author: input.author?.trim() || existing.author, coverUrl: input.coverUrl || existing.coverUrl, description: input.description || existing.description, publisher: input.publisher || existing.publisher, publishedYear: input.publishedYear || existing.publishedYear, isbn: input.isbn || existing.isbn, totalPages: input.totalPages || existing.totalPages } : {
    id: bookId,
    title: input.title.trim(),
    author: input.author?.trim() || "",
    coverUrl: input.coverUrl,
    description: input.description,
    publisher: input.publisher,
    publishedYear: input.publishedYear,
    isbn: input.isbn,
    totalPages: input.totalPages,
    createdAt: now,
  };
  const session: ReadingSession = {
    id: sessionId,
    bookId: book.id,
    status: input.status,
    source: input.source ?? "OTHER",
    startedAt: input.startedAt || (input.status === "READING" ? today() : undefined),
    finishedAt: input.finishedAt || (input.status === "FINISHED" ? today() : undefined),
    createdAt: now,
  };
  return { ...data, books: existing ? data.books : [book, ...data.books], sessions: [session, ...data.sessions] };
}

export function updateProgress(data: ArchiveData, sessionId: string, progress: Omit<ProgressLog, "id" | "sessionId">, logId = crypto.randomUUID()): ArchiveData {
  return {
    ...data,
    sessions: data.sessions.map((session) => session.id === sessionId ? { ...session, currentPage: progress.currentPage, currentChapter: progress.currentChapter } : session),
    progressLogs: [{ id: logId, sessionId, ...progress }, ...data.progressLogs],
  };
}

export function updateSession(data: ArchiveData, sessionId: string, patch: Partial<Omit<ReadingSession, "id" | "bookId" | "createdAt">>): ArchiveData {
  return { ...data, sessions: data.sessions.map((session) => session.id === sessionId ? { ...session, ...patch } : session) };
}

export function completeSession(data: ArchiveData, sessionId: string, finishedAt = today()) {
  return updateSession(data, sessionId, { status: "FINISHED", finishedAt });
}
export function removeBook(data: ArchiveData, bookId: string): ArchiveData { const sessionIds = new Set(data.sessions.filter(s=>s.bookId===bookId).map(s=>s.id)); return {...data, books:data.books.filter(b=>b.id!==bookId), sessions:data.sessions.filter(s=>s.bookId!==bookId), progressLogs:data.progressLogs.filter(l=>!sessionIds.has(l.sessionId)), notes:data.notes.filter(n=>!sessionIds.has(n.sessionId)), topics:data.topics.filter(t=>t.bookId!==bookId), posters:data.posters.filter(p=>!sessionIds.has(p.sessionId))}; }

export function durationDays(start?: string, end?: string) {
  if (!start || !end) return null;
  return Math.max(1, Math.floor((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / 86400000) + 1);
}

export function getArchiveStats(data: ArchiveData, now = new Date()) {
  const finished = data.sessions.filter((session) => session.status === "FINISHED" && session.finishedAt);
  const year = String(now.getFullYear());
  const month = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return {
    totalFinished: finished.length,
    yearFinished: finished.filter((session) => session.finishedAt?.startsWith(year)).length,
    monthFinished: finished.filter((session) => session.finishedAt?.startsWith(month)).length,
    currentlyReading: data.sessions.filter((session) => session.status === "READING").length,
  };
}

export function readArchive(): ArchiveData {
  if (typeof window === "undefined") return createEmptyArchive();
  try {
    const parsed = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "null") as ArchiveData | null;
    if (parsed?.version === 2) return parsed;
  } catch { /* corrupted local data falls back to an empty archive */ }
  const legacy = localStorage.getItem("books");
  if (legacy) {
    try {
      const old = JSON.parse(legacy) as Array<{ id?: string; title: string; author?: string; status?: ReadingStatus; page?: number; chapter?: string; startedAt?: string; finishedAt?: string }>;
      let migrated = createEmptyArchive();
      old.forEach((book, index) => {
        migrated = addReading(migrated, { title: book.title, author: book.author, status: book.status || "WANT_TO_READ", startedAt: book.startedAt, finishedAt: book.finishedAt }, `legacy-session-${index}`, book.id || `legacy-book-${index}`);
        const session = migrated.sessions[0];
        if (session && (book.page || book.chapter)) migrated = updateProgress(migrated, session.id, { date: today(), currentPage: book.page, currentChapter: book.chapter }, `legacy-log-${index}`);
      });
      writeArchive(migrated);
      return migrated;
    } catch { /* ignore malformed legacy data */ }
  }
  return createEmptyArchive();
}

export function writeArchive(data: ArchiveData) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(data));
    void fetch("/api/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).catch(() => undefined);
  }
}

export function bookWithLatestSession(data: ArchiveData, book: ArchiveBook) {
  return { book, session: data.sessions.find((session) => session.bookId === book.id) };
}

export function mergeCloudArchive(local: ArchiveData, cloud: { books?: Array<Record<string, unknown>>; sessions?: Array<Record<string, unknown>> }): ArchiveData {
  const books = (cloud.books || []).map((b) => ({ id: String(b.id), title: String(b.title || ""), author: String(b.author || ""), coverUrl: b.cover_url ? String(b.cover_url) : undefined, description: b.description ? String(b.description) : undefined, publisher: b.publisher ? String(b.publisher) : undefined, publishedYear: b.publish_year ? String(b.publish_year) : undefined, isbn: b.isbn ? String(b.isbn) : undefined, totalPages: b.total_pages ? Number(b.total_pages) : undefined, createdAt: String(b.created_at || new Date().toISOString()) }));
  const sessions = (cloud.sessions || []).map((s) => ({ id: String(s.id), bookId: String(s.book_id), status: s.status as ReadingSession["status"], source: (s.source || "OTHER") as ReadingSession["source"], startedAt: s.started_at ? String(s.started_at).slice(0, 10) : undefined, finishedAt: s.finished_at ? String(s.finished_at).slice(0, 10) : undefined, currentPage: s.current_page ? Number(s.current_page) : undefined, currentChapter: s.current_chapter ? String(s.current_chapter) : undefined, createdAt: String(s.created_at || new Date().toISOString()) }));
  return { ...local, books: [...books, ...local.books.filter((b) => !books.some((c) => c.id === b.id))], sessions: [...sessions, ...local.sessions.filter((s) => !sessions.some((c) => c.id === s.id))] };
}
