"use client";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import AddBookModal from "../components/add-book-modal";
import BottomNav from "../components/bottom-nav";
import { addReading, ArchiveData, createEmptyArchive, getArchiveStats, migrateArchiveAssets, readArchive, readCoverAsset, writeArchive } from "../lib/archive";

const statusMeta = {
  WANT_TO_READ: { label: "未读", className: "status-unread" },
  READING: { label: "在读", className: "status-reading" },
  FINISHED: { label: "已读", className: "status-finished" },
  PAUSED: { label: "暂停", className: "status-paused" },
} as const;

export default function Home() {
  const [a, setA] = useState<ArchiveData>(createEmptyArchive()), [add, setAdd] = useState(false), [q, setQ] = useState("");
  const [coverAssets, setCoverAssets] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const raw = readArchive();
      const migrated = await migrateArchiveAssets(raw);
      if (cancelled) return;
      setA(migrated);
      if (migrated !== raw) writeArchive(migrated);
    }
    void sync();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const keys = Array.from(new Set(a.books.map((book) => book.coverStoreKey).filter((key): key is string => Boolean(key))));
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
  }, [a.books, coverAssets]);
  const st = getArchiveStats(a);
  const save = (n: ArchiveData) => {
    setA(n);
    writeArchive(n);
  };

  return (
    <main className="shell">
      <header className="topbar">
        <div className="page-copy-group">
          <p className="eyebrow">READING ARCHIVE</p>
          <h1>我的书架</h1>
          <p className="muted">记录、阅读、AI 分析都围绕同一份书架展开。这里先看最近状态，再进入具体书籍。</p>
        </div>
        <div className="actions">
          <label className="searchbox">
            <Search size={17} />
            <input aria-label="搜索书名或作者" value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索书名或作者" />
          </label>
          <button className="primary" onClick={() => setAdd(true)}>
            <Plus size={18} /> 添加书籍
          </button>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <span>当前在读</span>
          <strong>{st.currentlyReading}</strong>
        </div>
        <div className="stat">
          <span>本年已读</span>
          <strong>{st.yearFinished}</strong>
        </div>
        <div className="stat">
          <span>累计已读</span>
          <strong>{st.totalFinished}</strong>
        </div>
      </section>

      {a.books.length ? (
        <section className="book-grid">
          {a.books
            .filter((b) => (b.title + b.author).toLowerCase().includes(q.toLowerCase()))
            .map((b) => {
              const status = a.sessions.find((s) => s.bookId === b.id)?.status || "WANT_TO_READ";
              const meta = statusMeta[status];
              const coverSrc = b.coverUrl || (b.coverStoreKey ? coverAssets[b.coverStoreKey] : "");

              return (
                <article className="book-card" key={b.id}>
                  <a className="book-link" href={"/book/" + b.id}>
                    <div className="cover-placeholder">{coverSrc ? <span style={{ backgroundImage: "url(" + coverSrc + ")" }} /> : <BookOpen size={30} />}</div>
                    <div className="book-info">
                      <h3>{b.title}</h3>
                      <p>{b.author || "未知作者"}</p>
                      <span className={`badge status-badge ${meta.className}`}>{meta.label}</span>
                    </div>
                  </a>
                </article>
              );
            })}
        </section>
      ) : (
        <section className="empty">
          <div className="empty-icon">
            <BookOpen size={34} />
          </div>
          <h2>书架还是空的</h2>
          <p>从添加第一本书开始，建立属于你的阅读档案。</p>
          <button className="primary" onClick={() => setAdd(true)}>
            <Plus size={18} /> 添加第一本书
          </button>
        </section>
      )}

      <BottomNav active="library" />
      {add && <AddBookModal onClose={() => setAdd(false)} onSave={(x) => { save(addReading(a, x)); setAdd(false); }} />}
    </main>
  );
}
