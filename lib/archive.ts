import type { PosterCompositionMode, PosterVisualClimate, PosterVisualDirection } from "./poster-spec";

export type ReadingStatus = "WANT_TO_READ" | "READING" | "FINISHED" | "PAUSED";
export type ReadingSource = "WECHAT_READING" | "KINDLE" | "PAPER" | "OTHER";

export interface ArchiveBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  coverStoreKey?: string;
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
export interface PosterTypography {
  titleFont: string;
  subtitleFont: string;
  bodyFont: string;
  quoteFont: string;
  accentFont: string;
  tagFont: string;
  titleWeight: number;
  titleSpacing: number;
}
export interface PosterStyleFingerprint {
  book_type: string;
  narrative_mode: string;
  space_type: string;
  subject_type: string;
  light_type: string;
  color_mood: string;
  material_focus: string;
  emotion_tone: string;
  visual_symbol: string;
  visual_climate: PosterVisualClimate;
  composition_mode: PosterCompositionMode;
  color_persona: string;
}
export interface PosterRecord {
  id: string;
  sessionId: string;
  imageDataUrl: string;
  imageStoreKey?: string;
  createdAt: string;
  backgroundImageUrl?: string;
  backgroundStoreKey?: string;
  draft?: {
    heading: string;
    subtitle: string;
    highlight: string;
    value?: string;
    cta: string;
    tags: string[];
  };
  visual?: {
    prompt: string;
    style: string;
    mood: string;
    palette: string[];
    composition: string;
    negativePrompt: string;
    direction?: PosterVisualDirection;
    fingerprint?: PosterStyleFingerprint;
    qualityScore?: number;
  };
  typography?: PosterTypography;
  tone?: string;
}
export interface TopicInsight { label: string; weight: number; reason: string; books: string[] }
export interface TopicAnalysis { overview: string; commonThemes: TopicInsight[]; branches: TopicInsight[] }

export interface ArchiveData {
  version: 2;
  books: ArchiveBook[];
  sessions: ReadingSession[];
  progressLogs: ProgressLog[];
  notes: ReadingNote[];
  topics: BookTopic[];
  posters: PosterRecord[];
  topicAnalysis?: TopicAnalysis;
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
export const ARCHIVE_UPDATED_EVENT = "reading-archive-updated";
const POSTER_ASSET_DB = "reading-archive-assets";
const POSTER_ASSET_STORE = "poster-assets";
const isDataUrlAsset = (value?: string) => typeof value === "string" && value.startsWith("data:");
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
  const nextCoverUrl = input.coverUrl || existing?.coverUrl;
  const nextCoverStoreKey = input.coverUrl && !isDataUrlAsset(input.coverUrl) ? undefined : existing?.coverStoreKey;
  const book: ArchiveBook = existing ? { ...existing, author: input.author?.trim() || existing.author, coverUrl: nextCoverUrl, coverStoreKey: nextCoverStoreKey, description: input.description || existing.description, publisher: input.publisher || existing.publisher, publishedYear: input.publishedYear || existing.publishedYear, isbn: input.isbn || existing.isbn, totalPages: input.totalPages || existing.totalPages } : {
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
export function removeBook(data: ArchiveData, bookId: string): ArchiveData { const sessionIds = new Set(data.sessions.filter(s=>s.bookId===bookId).map(s=>s.id)); return {...data, books:data.books.filter(b=>b.id!==bookId), sessions:data.sessions.filter(s=>s.bookId!==bookId), progressLogs:data.progressLogs.filter(l=>!sessionIds.has(l.sessionId)), notes:data.notes.filter(n=>!sessionIds.has(n.sessionId)), topics:data.topics.filter(t=>t.bookId!==bookId), posters:data.posters.filter(p=>!sessionIds.has(p.sessionId)), topicAnalysis: undefined}; }

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

function compactPosterRecord(poster: PosterRecord): PosterRecord {
  return {
    ...poster,
    imageDataUrl: poster.imageStoreKey ? "" : poster.imageDataUrl,
    backgroundImageUrl: poster.backgroundStoreKey ? undefined : poster.backgroundImageUrl,
  };
}

function compactBookRecord(book: ArchiveBook): ArchiveBook {
  return {
    ...book,
    coverUrl: book.coverStoreKey ? "" : book.coverUrl,
  };
}

function compactArchiveForLocalStorage(data: ArchiveData): ArchiveData {
  return {
    ...data,
    books: data.books.map(compactBookRecord),
    posters: data.posters.map(compactPosterRecord),
  };
}

async function hydrateArchiveAssetsForSync(data: ArchiveData) {
  let changed = false;
  const books = await Promise.all(data.books.map(async (book) => {
    const coverUrl = await resolveCoverAsset(book);
    if (!coverUrl || coverUrl === book.coverUrl) {
      return book;
    }
    changed = true;
    return { ...book, coverUrl };
  }));

  const posters = await Promise.all(data.posters.map(async (poster) => {
    let nextPoster = poster;
    if (poster.imageStoreKey && !isDataUrlAsset(poster.imageDataUrl)) {
      const imageDataUrl = await readPosterAsset(poster.imageStoreKey);
      if (imageDataUrl) {
        nextPoster = { ...nextPoster, imageDataUrl };
        changed = true;
      }
    }
    if (poster.backgroundStoreKey && !isDataUrlAsset(poster.backgroundImageUrl)) {
      const backgroundImageUrl = await readPosterAsset(poster.backgroundStoreKey);
      if (backgroundImageUrl) {
        nextPoster = { ...nextPoster, backgroundImageUrl };
        changed = true;
      }
    }
    return nextPoster;
  }));

  return changed ? { ...data, books, posters } : data;
}

async function syncArchiveToSource(data: ArchiveData) {
  try {
    const hydrated = await hydrateArchiveAssetsForSync(data);
    await fetch("/api/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(hydrated) });
  } catch {
    return;
  }
}

function persistArchiveToLocalStorage(data: ArchiveData) {
  const compact = compactArchiveForLocalStorage(data);
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(compact));
    return compact;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") throw error;
    const stripped = {
      ...compact,
      books: compact.books.map((book) => ({
        ...book,
        coverUrl: book.coverStoreKey || isDataUrlAsset(book.coverUrl) ? "" : book.coverUrl,
        coverStoreKey: book.coverStoreKey,
      })),
      posters: compact.posters.map((poster) => ({ ...poster, imageDataUrl: "", backgroundImageUrl: undefined })),
    };
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(stripped));
    return stripped;
  }
}

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function mergeUniqueBy<T>(primary: T[], secondary: T[], keyOf: (item: T) => string) {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = keyOf(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function archiveHasEmbeddedAssetData(data: Pick<ArchiveData, "books" | "posters">) {
  return data.books.some((book) => isDataUrlAsset(book.coverUrl)) || data.posters.some((poster) => isDataUrlAsset(poster.imageDataUrl) || isDataUrlAsset(poster.backgroundImageUrl));
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsDataUrl(url?: string) {
  if (!url || isDataUrlAsset(url)) return "";
  if (!/^https?:\/\//i.test(url)) return "";
  try {
    const response = await fetch(url, { headers: { accept: "image/*" } });
    if (!response.ok) return "";
    return blobToDataUrl(await response.blob());
  } catch {
    return "";
  }
}

async function resolveCoverAsset(book: ArchiveBook) {
  if (isDataUrlAsset(book.coverUrl)) {
    return book.coverUrl || "";
  }
  if (book.coverStoreKey) {
    const stored = await readCoverAsset(book.coverStoreKey);
    if (stored) return stored;
  }
  const fetched = await fetchImageAsDataUrl(book.coverUrl);
  return fetched || book.coverUrl || "";
}

export function writeArchive(data: ArchiveData) {
  if (typeof window !== "undefined") {
    persistArchiveToLocalStorage(data);
    window.dispatchEvent(new Event(ARCHIVE_UPDATED_EVENT));
    void syncArchiveToSource(data);
  }
}

export function writeArchiveLocally(data: ArchiveData) {
  if (typeof window === "undefined") return;
  persistArchiveToLocalStorage(data);
  window.dispatchEvent(new Event(ARCHIVE_UPDATED_EVENT));
}

function openPosterAssetDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(POSTER_ASSET_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(POSTER_ASSET_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAsset(key: string, dataUrl: string) {
  if (!dataUrl) return;
  const db = await openPosterAssetDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(POSTER_ASSET_STORE, "readwrite");
    tx.objectStore(POSTER_ASSET_STORE).put(dataUrl, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function readAsset(key?: string) {
  if (!key) return "";
  try {
    const db = await openPosterAssetDb();
    const value = await new Promise<string>((resolve, reject) => {
      const tx = db.transaction(POSTER_ASSET_STORE, "readonly");
      const request = tx.objectStore(POSTER_ASSET_STORE).get(key);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : "");
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  } catch {
    return "";
  }
}

export async function savePosterAsset(key: string, dataUrl: string) {
  return saveAsset(key, dataUrl);
}

export async function saveCoverAsset(key: string, dataUrl: string) {
  return saveAsset(key, dataUrl);
}

export async function readPosterAsset(key?: string) {
  return readAsset(key);
}

export async function readCoverAsset(key?: string) {
  return readAsset(key);
}

export async function clearPosterAssets() {
  try {
    const db = await openPosterAssetDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(POSTER_ASSET_STORE, "readwrite");
      const store = tx.objectStore(POSTER_ASSET_STORE);
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (typeof cursor.key === "string" && cursor.key.startsWith("poster:")) {
          cursor.delete();
        }
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    return;
  }
}

export async function migrateArchiveAssets(data: ArchiveData) {
  let changed = false;
  const books = await Promise.all(data.books.map(async (book) => {
    if (book.coverStoreKey) {
      return book;
    }
    if (!isDataUrlAsset(book.coverUrl)) {
      return book;
    }
    const key = `cover:${book.id}`;
    await saveCoverAsset(key, book.coverUrl || "");
    changed = true;
    return { ...book, coverStoreKey: key, coverUrl: "" };
  }));

  const posters = await Promise.all(data.posters.map(async (poster) => {
    let nextPoster = poster;
    if (!poster.imageStoreKey && isDataUrlAsset(poster.imageDataUrl)) {
      const key = `poster:${poster.id}:final`;
      await savePosterAsset(key, poster.imageDataUrl);
      nextPoster = { ...nextPoster, imageStoreKey: key, imageDataUrl: "" };
      changed = true;
    }
    if (!nextPoster.backgroundStoreKey && isDataUrlAsset(nextPoster.backgroundImageUrl)) {
      const key = `poster:${poster.id}:background`;
      await savePosterAsset(key, nextPoster.backgroundImageUrl || "");
      nextPoster = { ...nextPoster, backgroundStoreKey: key, backgroundImageUrl: undefined };
      changed = true;
    }
    return nextPoster;
  }));

  return changed ? { ...data, books, posters } : data;
}

export function bookWithLatestSession(data: ArchiveData, book: ArchiveBook) {
  return { book, session: data.sessions.find((session) => session.bookId === book.id) };
}

type CloudArchivePayload = {
  books?: Array<Record<string, unknown>>;
  sessions?: Array<Record<string, unknown>>;
  progressLogs?: Array<Record<string, unknown>>;
  notes?: Array<Record<string, unknown>>;
  topics?: Array<Record<string, unknown>>;
  posters?: Array<Record<string, unknown>>;
  topicAnalysis?: TopicAnalysis;
};

function mapCloudBook(book: Record<string, unknown>): ArchiveBook | null {
  const id = String(book.id || "").trim();
  if (!id) return null;
  return {
    id,
    title: String(book.title || "").trim(),
    author: String(book.author || "").trim(),
    coverUrl: toOptionalString(book.cover_url),
    description: toOptionalString(book.description),
    publisher: toOptionalString(book.publisher),
    publishedYear: toOptionalString(book.publish_year),
    isbn: toOptionalString(book.isbn),
    totalPages: toOptionalNumber(book.total_pages),
    createdAt: String(book.created_at || new Date().toISOString()),
  };
}

function mapCloudSession(session: Record<string, unknown>): ReadingSession | null {
  const id = String(session.id || "").trim();
  const bookId = String(session.book_id || "").trim();
  if (!id || !bookId) return null;
  return {
    id,
    bookId,
    status: (session.status as ReadingSession["status"]) || "WANT_TO_READ",
    source: (session.source as ReadingSession["source"]) || "OTHER",
    startedAt: toOptionalString(session.started_at)?.slice(0, 10),
    finishedAt: toOptionalString(session.finished_at)?.slice(0, 10),
    currentPage: toOptionalNumber(session.current_page),
    currentChapter: toOptionalString(session.current_chapter),
    createdAt: String(session.created_at || new Date().toISOString()),
  };
}

function mapCloudProgressLog(entry: Record<string, unknown>): ProgressLog | null {
  const id = String(entry.id || "").trim();
  const sessionId = String(entry.reading_session_id || "").trim();
  if (!id || !sessionId) return null;
  return {
    id,
    sessionId,
    date: toOptionalString(entry.log_date)?.slice(0, 10) || today(),
    currentPage: toOptionalNumber(entry.page_number),
    currentChapter: toOptionalString(entry.chapter_text),
  };
}

function mapCloudNote(entry: Record<string, unknown>): ReadingNote | null {
  const sessionId = String(entry.reading_session_id || "").trim();
  if (!sessionId) return null;
  return {
    sessionId,
    content: toOptionalString(entry.reading_notes) || "",
    personalInput: toOptionalString(entry.one_sentence_summary),
    savedAt: String(entry.updated_at || entry.created_at || new Date().toISOString()),
  };
}

function mapCloudTopic(entry: Record<string, unknown>): BookTopic | null {
  const bookId = String(entry.book_id || "").trim();
  const topic = toOptionalString(entry.topic);
  const normalizedTopic = toOptionalString(entry.normalized_topic);
  if (!bookId || !topic || !normalizedTopic) return null;
  return { bookId, topic, normalizedTopic };
}

function mapCloudPoster(entry: Record<string, unknown>): PosterRecord | null {
  const id = String(entry.id || "").trim();
  const sessionId = String(entry.reading_session_id || "").trim();
  if (!id || !sessionId) return null;
  return {
    id,
    sessionId,
    imageDataUrl: toOptionalString(entry.final_image_url) || "",
    createdAt: String(entry.created_at || new Date().toISOString()),
    backgroundImageUrl: toOptionalString(entry.background_image_url),
  };
}

export function mergeCloudArchive(local: ArchiveData, cloud: CloudArchivePayload): ArchiveData {
  const cloudBooks = (cloud.books || []).map(mapCloudBook).filter((item): item is ArchiveBook => Boolean(item));
  const cloudSessions = (cloud.sessions || []).map(mapCloudSession).filter((item): item is ReadingSession => Boolean(item));
  const cloudProgressLogs = (cloud.progressLogs || []).map(mapCloudProgressLog).filter((item): item is ProgressLog => Boolean(item));
  const cloudNotes = (cloud.notes || []).map(mapCloudNote).filter((item): item is ReadingNote => Boolean(item));
  const cloudTopics = (cloud.topics || []).map(mapCloudTopic).filter((item): item is BookTopic => Boolean(item));
  const cloudPosters = (cloud.posters || []).map(mapCloudPoster).filter((item): item is PosterRecord => Boolean(item));

  return {
    ...local,
    books: mergeUniqueBy(cloudBooks, local.books, (item) => item.id),
    sessions: mergeUniqueBy(cloudSessions, local.sessions, (item) => item.id),
    progressLogs: mergeUniqueBy(cloudProgressLogs, local.progressLogs, (item) => item.id),
    notes: mergeUniqueBy(cloudNotes, local.notes, (item) => item.sessionId),
    topics: mergeUniqueBy(cloudTopics, local.topics, (item) => `${item.bookId}:${item.normalizedTopic}`),
    posters: mergeUniqueBy(cloudPosters, local.posters, (item) => item.id),
    topicAnalysis: cloud.topicAnalysis ?? local.topicAnalysis,
  };
}

export async function pullArchiveFromSyncSource(base: ArchiveData = createEmptyArchive()): Promise<{ archive: ArchiveData; mode: string; synced: boolean; sourceHasEmbeddedAssets: boolean }> {
  if (typeof window === "undefined") return { archive: base, mode: "local", synced: false, sourceHasEmbeddedAssets: false };
  try {
    const response = await fetch("/api/sync", { headers: { accept: "application/json" } });
    const data = (await response.json()) as any;
    if (!data.synced) return { archive: base, mode: String(data.mode || "local"), synced: false, sourceHasEmbeddedAssets: false };
    const sourceHasEmbeddedAssets = archiveHasEmbeddedAssetData({ books: Array.isArray(data.books) ? data.books : [], posters: Array.isArray(data.posters) ? data.posters : [] } as Pick<ArchiveData, "books" | "posters">);
    if ("mode" in data && data.mode === "local-file" && "version" in data && data.version === 2) {
      return { archive: await migrateArchiveAssets(data as ArchiveData), mode: "local-file", synced: true, sourceHasEmbeddedAssets };
    }
    const mode = String(data.mode || "supabase");
    return { archive: await migrateArchiveAssets(mergeCloudArchive(base, data as CloudArchivePayload)), mode: mode === "supabase" ? "supabase" : mode, synced: true, sourceHasEmbeddedAssets };
  } catch {
    return { archive: base, mode: "local", synced: false, sourceHasEmbeddedAssets: false };
  }
}
