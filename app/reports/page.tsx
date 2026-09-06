"use client";

import { useEffect, useState } from "react";
import BottomNav from "../../components/bottom-nav";
import TopicAnalysisPanel from "../../components/topic-analysis-panel";
import {
  ARCHIVE_UPDATED_EVENT,
  ArchiveData,
  createEmptyArchive,
  getArchiveStats,
  readArchive,
} from "../../lib/archive";

export default function Reports() {
  const [a, setA] = useState<ArchiveData>(createEmptyArchive());

  useEffect(() => {
    const sync = () => setA(readArchive());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
  }, []);

  const st = getArchiveStats(a);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="page-copy-group">
          <p className="eyebrow">READING REPORTS</p>
          <h1>阅读报告</h1>
          <p className="muted">这里聚合 AI 主题分析与阅读结构摘要，保持简洁而非报表化。</p>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <span>本月完成</span>
          <strong>{st.monthFinished}</strong>
        </div>
        <div className="stat">
          <span>本年完成</span>
          <strong>{st.yearFinished}</strong>
        </div>
        <div className="stat">
          <span>累计完成</span>
          <strong>{st.totalFinished}</strong>
        </div>
      </section>

      <TopicAnalysisPanel archive={a} onArchiveChange={setA} />

      <BottomNav active="reports" />
    </main>
  );
}
