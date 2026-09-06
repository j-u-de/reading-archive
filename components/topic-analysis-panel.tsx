"use client";

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { aiFetch } from "../lib/ai-client";
import { ArchiveData, TopicAnalysis, writeArchive } from "../lib/archive";

type TopicAnalysisPanelProps = {
  archive: ArchiveData;
  onArchiveChange: (next: ArchiveData) => void;
};

function toThemeLine(title: string, books: string[]) {
  return (
    <article className="topic-item topic-item-common">
      <strong>{title}</strong>
      <span>{books.join(" · ")}</span>
    </article>
  );
}

function toBranchLine(title: string, books: string[]) {
  return (
    <article className="topic-item topic-item-branch">
      <strong>{title}</strong>
      <span>{books.join(" · ")}</span>
    </article>
  );
}

export default function TopicAnalysisPanel({ archive, onArchiveChange }: TopicAnalysisPanelProps) {
  const [busy, setBusy] = useState(false);
  const analysis = archive.topicAnalysis;

  async function generate() {
    setBusy(true);
    try {
      const response = await aiFetch("/api/ai/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          books: archive.books.map((book) => ({
            title: book.title,
            author: book.author,
            description: book.description,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.analysis) throw new Error(data?.error || "分析生成失败");
      const next = { ...archive, topicAnalysis: data.analysis as TopicAnalysis };
      onArchiveChange(next);
      writeArchive(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ai-settings-form">
      <div className="ai-settings-section">
        <div className="section-head">
          <div>
            <h2>AI 主题分析</h2>
            <p className="muted">从整本书架里提炼共性、分支和阅读重心，而不是做关键词罗列。</p>
          </div>
          <button className="secondary-card" onClick={generate} disabled={busy || !archive.books.length}>
            {busy ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
            {busy ? "生成中…" : "生成/刷新分析"}
          </button>
        </div>
      </div>

      {analysis ? (
        <div className="topic-analysis">
          <section className="ai-settings-section">
            <h2>AI 总结</h2>
            <p className="topic-overview-art">{analysis.overview}</p>
          </section>

          <section className="ai-settings-section">
            <h2>一句话理解</h2>
            <div className="stat">
              <span>书架主线</span>
              <strong style={{ fontSize: 22, lineHeight: 1.45, marginTop: 10, fontWeight: 600 }}>
                {analysis.commonThemes[0]?.label || "尚未形成稳定主题"}
              </strong>
              <p className="muted" style={{ marginTop: 10 }}>
                {analysis.commonThemes[0]?.reason || "点击刷新后会生成更完整的主题解读。"}
              </p>
            </div>
          </section>

          <section className="ai-settings-section">
            <h2>核心主题</h2>
            <div className="topic-list">
              {analysis.commonThemes.map((item) => toThemeLine(item.label, item.books))}
            </div>
          </section>

          <section className="ai-settings-section">
            <h2>分支分析</h2>
            <div className="topic-list">
              {analysis.branches.map((item) => toBranchLine(item.label, item.books))}
            </div>
          </section>
        </div>
      ) : (
        <div className="ai-settings-section">
          <p className="muted">点击“生成/刷新分析”后，会基于当前书架形成共性和分支结构。</p>
        </div>
      )}
    </section>
  );
}
