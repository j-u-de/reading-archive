"use client";

import { useState } from "react";
import { Loader2, PenLine, Search, Sparkles, X } from "lucide-react";
import { aiFetch } from "../lib/ai-client";
import type { AddReadingInput, ReadingSource, ReadingStatus } from "../lib/archive";
import { searchBooksFromBrowser } from "../lib/providers/book-metadata-client";

type Candidate = {
  title: string;
  author?: string;
  publisher?: string;
  publishedYear?: string;
  description?: string;
  isbn?: string;
  coverUrl?: string;
};

export default function AddBookModal({ onClose, onSave }: { onClose: () => void; onSave: (value: AddReadingInput) => void }) {
  const [query, setQuery] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function search() {
    setBusy(true);
    setMessage("正在联网搜索，请稍候…");
    try {
      const results = await searchBooksFromBrowser(query);
      if (results.length) {
        const item = results[0];
        setCandidate({
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          publishedYear: item.publish_year ? String(item.publish_year) : "",
          description: item.description,
          isbn: item.isbn,
          coverUrl: item.cover_url,
        });
        setMessage("已从公开书库获取结果。");
        return;
      }

      const response = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      const item = data.results?.[0];
      if (item) {
        setCandidate({
          title: item.title,
          author: item.author,
          publisher: item.publisher,
          publishedYear: item.publish_year ? String(item.publish_year) : "",
          description: item.description,
          isbn: item.isbn,
          coverUrl: item.cover_url,
        });
        setMessage("已从公开书库获取结果。");
      } else {
        setMessage(data.message || "暂无联网结果。");
      }
    } finally {
      setBusy(false);
    }
  }

  async function parse() {
    setBusy(true);
    setMessage("AI 正在解析书目信息，请稍候…");
    try {
      const response = await aiFetch("/api/books/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCandidate(data);
      setMessage(data.coverUrl ? "解析完成，已获取封面。" : "解析完成，未找到可验证封面。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "解析失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <button className="close" onClick={onClose} aria-label="关闭">
          <X />
        </button>

        {!candidate ? (
          <>
            <div className="section-head">
              <div>
                <p className="eyebrow">ADD BOOK</p>
                <h2>添加书籍</h2>
                <p className="muted">可以联网搜索，也可以交给 AI 解析书目信息。</p>
              </div>
            </div>

            <label>
              书名或 ISBN
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入书名或 ISBN" />
            </label>

            <div className="modal-actions modal-actions-triple">
              <button className="modal-action" onClick={search} disabled={!query.trim() || busy}>
                <Search size={16} />
                {busy ? "处理中…" : "联网搜索"}
              </button>
              <button className="modal-action" onClick={parse} disabled={!query.trim() || busy}>
                {busy ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                {busy ? "处理中…" : "AI 解析"}
              </button>
              <button className="modal-action" onClick={() => setCandidate({ title: query })} disabled={!query.trim() || busy}>
                <PenLine size={16} />
                手动编辑
              </button>
            </div>

            {message && <p className="status-message">{message}</p>}
          </>
        ) : (
          <Confirm candidate={candidate} onBack={() => setCandidate(null)} onSave={onSave} />
        )}
      </div>
    </div>
  );
}

function Confirm({ candidate, onBack, onSave }: { candidate: Candidate; onBack: () => void; onSave: (value: AddReadingInput) => void }) {
  const [title, setTitle] = useState(candidate.title);
  const [author, setAuthor] = useState(candidate.author || "");
  const [publisher, setPublisher] = useState(candidate.publisher || "");
  const [year, setYear] = useState(candidate.publishedYear || "");
  const [description, setDescription] = useState(candidate.description || "");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          title,
          author,
          publisher,
          publishedYear: year,
          description,
          isbn: candidate.isbn,
          coverUrl: candidate.coverUrl,
          status: "READING" as ReadingStatus,
          source: "OTHER" as ReadingSource,
        });
      }}
    >
      <div className="section-head">
        <div>
          <p className="eyebrow">CONFIRM</p>
          <h2>确认书籍信息</h2>
          <p className="muted">保存前可继续修改书名、作者、出版社与简介。</p>
        </div>
      </div>

      <label>
        书名
        <input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        作者
        <input value={author} onChange={(event) => setAuthor(event.target.value)} />
      </label>
      <label>
        出版社
        <input value={publisher} onChange={(event) => setPublisher(event.target.value)} />
      </label>
      <label>
        出版年份
        <input value={year} onChange={(event) => setYear(event.target.value)} />
      </label>
      <label>
        简介
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
      </label>

      <div className="modal-actions modal-actions-pair">
        <button type="button" className="modal-action" onClick={onBack}>
          返回
        </button>
        <button className="modal-action">保存到书架</button>
      </div>
    </form>
  );
}
