"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Trash2, Upload } from "lucide-react";
import { aiFetch } from "../../../lib/ai-client";
import {
  ARCHIVE_UPDATED_EVENT,
  ArchiveData,
  completeSession,
  createEmptyArchive,
  durationDays,
  migrateArchiveAssets,
  readArchive,
  readCoverAsset,
  removeBook,
  saveCoverAsset,
  updateProgress,
  writeArchive,
} from "../../../lib/archive";

const statusMeta = {
  WANT_TO_READ: { label: "未读", className: "status-unread" },
  READING: { label: "在读", className: "status-reading" },
  FINISHED: { label: "已读", className: "status-finished" },
  PAUSED: { label: "暂停", className: "status-paused" },
} as const;

export default function BookDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [archive, setArchive] = useState<ArchiveData>(createEmptyArchive());
  const [page, setPage] = useState("");
  const [chapter, setChapter] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverAssets, setCoverAssets] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const raw = readArchive();
      const migrated = await migrateArchiveAssets(raw);
      if (cancelled) return;
      setArchive(migrated);
      const session = migrated.sessions.find((item) => item.bookId === id);
      const savedNote = session && migrated.notes.find((item) => item.sessionId === session.id);
      if (savedNote) setNote(savedNote.content);
      if (migrated !== raw) writeArchive(migrated);
    }
    void sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const keys = Array.from(new Set(archive.books.map((book) => book.coverStoreKey).filter((key): key is string => Boolean(key))));
    const missing = keys.filter((key) => !coverAssets[key]);
    if (!missing.length) return;
    let cancelled = false;
    async function load() {
      const entries = await Promise.all(missing.map(async (key) => [key, await readCoverAsset(key)] as const));
      if (cancelled) return;
      setCoverAssets((current) => {
        const next = { ...current };
        entries.forEach(([key, value]) => {
          if (value) next[key] = value;
        });
        return next;
      });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [archive.books, coverAssets]);

  const book = archive.books.find((item) => item.id === id);
  const session = archive.sessions.find((item) => item.bookId === id);
  if (!book || !session) {
    return (
      <main className="shell">
        <h1>找不到这本书</h1>
      </main>
    );
  }

  const currentBook = book;
  const currentSession = session;

  const meta = statusMeta[currentSession.status];
  const logs = archive.progressLogs.filter((item) => item.sessionId === currentSession.id);
  const coverSrc = currentBook.coverUrl || (currentBook.coverStoreKey ? coverAssets[currentBook.coverStoreKey] : "");

  const save = (data: ArchiveData) => {
    setArchive(data);
    writeArchive(data);
  };

  const saveNote = (content: string) =>
    save({
      ...archive,
      notes: [...archive.notes.filter((item) => item.sessionId !== session.id), { sessionId: session.id, content, savedAt: new Date().toISOString() }],
    });

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const coverStoreKey = `cover:${currentBook.id}`;
      await saveCoverAsset(coverStoreKey, dataUrl);
      setCoverAssets((current) => ({ ...current, [coverStoreKey]: dataUrl }));
      save({
        ...archive,
        books: archive.books.map((item) => (item.id === currentBook.id ? { ...item, coverUrl: "", coverStoreKey } : item)),
      });
    };
    reader.readAsDataURL(file);
  }

  async function generateNote() {
    setLoading(true);
    try {
      const response = await aiFetch("/api/ai/reading-note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: currentBook.title, author: currentBook.author, description: currentBook.description }),
      });
      const data = await response.json();
      const content = [data.one_sentence_summary, ...(data.core_points || []), data.reading_notes, ...(data.insights || [])].filter(Boolean).join("\n\n");
      setNote(content);
      saveNote(content);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="page-copy-group">
          <button className="text-button" onClick={() => router.push("/")}>
            <ArrowLeft size={16} />
            返回书架
          </button>
          <p className="eyebrow">BOOK DETAIL</p>
          <h1>{currentBook.title}</h1>
          <p className="muted">{currentBook.author || "未知作者"}</p>
        </div>
        <button
          className="danger"
          onClick={() => {
            if (confirm("确定删除这本书及全部数据吗？")) {
              save(removeBook(archive, currentBook.id));
              router.push("/");
            }
          }}
        >
          <Trash2 size={16} />
          删除书籍
        </button>
      </header>

      <section className="detail-hero ai-settings-section" style={{ display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", gap: 24 }}>
        <div>
          <div className="detail-cover">{coverSrc ? <span style={{ backgroundImage: `url(${coverSrc})` }} /> : <BookOpen size={42} />}</div>
          <label className="upload-cover">
            <Upload size={15} />
            上传封面
            <input type="file" accept="image/*" onChange={upload} />
          </label>
        </div>
        <div className="page-copy-group">
          <span className={`badge status-badge ${meta.className}`} style={{ width: "fit-content" }}>
            {meta.label}
          </span>
          {currentBook.publisher && <p>出版社：{currentBook.publisher}</p>}
          {currentBook.publishedYear && <p>出版年份：{currentBook.publishedYear}</p>}
          {currentBook.description && <p className="description">{currentBook.description}</p>}
          <div className="stats" style={{ marginTop: 6 }}>
            <div className="stat">
              <span>开始时间</span>
              <strong>{currentSession.startedAt || "未记录"}</strong>
            </div>
            <div className="stat">
              <span>结束时间</span>
              <strong>{currentSession.finishedAt || "未完成"}</strong>
            </div>
            <div className="stat">
              <span>阅读周期</span>
              <strong>{durationDays(currentSession.startedAt, currentSession.finishedAt) ? `${durationDays(currentSession.startedAt, currentSession.finishedAt)} 天` : "待完成"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ai-settings-form">
        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>更新阅读进度</h2>
              <p className="muted">保留当前进度和章节，不改变阅读会话结构。</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              当前页码
              <input type="number" value={page} onChange={(event) => setPage(event.target.value)} />
            </label>
            <label>
              当前章节
              <input value={chapter} onChange={(event) => setChapter(event.target.value)} />
            </label>
          </div>
          <button
            className="primary"
            onClick={() => {
              save(updateProgress(archive, session.id, { date: new Date().toISOString().slice(0, 10), currentPage: page ? Number(page) : undefined, currentChapter: chapter || undefined }));
              setPage("");
              setChapter("");
            }}
          >
            保存进度
          </button>
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>进度历史</h2>
              <p className="muted">以时间线形式查看阅读节奏。</p>
            </div>
          </div>
          {logs.length ? (
            <div className="topic-list">
              {logs.map((entry) => (
                <div className="history-row" key={entry.id}>
                  <strong>{entry.date}</strong>
                  <span>
                    {entry.currentPage ? `第 ${entry.currentPage} 页` : ""}
                    {entry.currentChapter ? ` · ${entry.currentChapter}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">还没有进度记录。</p>
          )}
        </div>

        {session.status === "READING" && (
          <div className="ai-settings-section">
            <div className="section-head">
              <div>
                <h2>阅读完成</h2>
                <p className="muted">完成后可继续生成 AI 阅读笔记。</p>
              </div>
            </div>
            <button className="primary" onClick={() => save(completeSession(archive, session.id))}>
              完成阅读
            </button>
          </div>
        )}

        {session.status === "FINISHED" && (
          <div className="ai-settings-section">
            <div className="section-head">
              <div>
                <h2>AI 阅读笔记</h2>
                <p className="muted">生成后可以继续手动编辑并保存回档案。</p>
              </div>
              <button className="primary" onClick={generateNote} disabled={loading}>
                {loading ? "生成中…" : note ? "重新生成" : "生成笔记"}
              </button>
            </div>
            {note && (
              <>
                <textarea className="note-editor" value={note} onChange={(event) => setNote(event.target.value)} rows={12} />
                <button className="secondary-card" onClick={() => saveNote(note)}>
                  保存编辑
                </button>
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
