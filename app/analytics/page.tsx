"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BottomNav from "../../components/bottom-nav";
import {
  ARCHIVE_UPDATED_EVENT,
  ArchiveData,
  createEmptyArchive,
  getArchiveStats,
  readArchive,
} from "../../lib/archive";

const monthFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" });
const dayFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" });

const shiftMonth = (value: string, offset: number) => {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function Analytics() {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [archive, setArchive] = useState<ArchiveData>(createEmptyArchive());
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setArchive(readArchive());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
    };
  }, []);

  const days = Array.from(
    { length: new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate() },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );

  const booksFor = (date: string) => {
    const seen = new Set<string>();
    return archive.sessions
      .filter((session) => session.startedAt === date || session.finishedAt === date)
      .map((session) => archive.books.find((book) => book.id === session.bookId)?.title)
      .filter((title): title is string => {
        if (!title || seen.has(title)) return false;
        seen.add(title);
        return true;
      });
  };

  const monthLabel = monthFormatter.format(new Date(+month.slice(0, 4), +month.slice(5, 7) - 1, 1));
  const stats = getArchiveStats(archive);
  const recentFinished = archive.sessions.filter((session) => session.status === "FINISHED").slice(0, 12);
  const selectedBooks = selectedDay ? booksFor(selectedDay) : [];

  const trend = useMemo(() => {
    const current = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(current.getFullYear(), current.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const count = archive.sessions.filter((session) => session.finishedAt?.startsWith(key)).length;
      return { label: `${date.getMonth() + 1}月`, count };
    });
  }, [archive.sessions]);

  const weeklyAverage = useMemo(() => {
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const daysElapsed = Math.max(1, Math.ceil((Date.now() - yearStart.getTime()) / 86400000));
    return Math.max(0, Math.round((stats.yearFinished / (daysElapsed / 7)) * 10) / 10);
  }, [stats.yearFinished]);

  const openMonthPicker = () => {
    const picker = pickerRef.current as HTMLInputElement & { showPicker?: () => void };
    if (picker?.showPicker) picker.showPicker();
    else picker?.click();
  };

  async function generateReport() {
    setLoading(true);
    let ai = {};
    try {
      ai = JSON.parse(localStorage.getItem("reading-archive-ai-config") || "{}");
    } catch {}

    try {
      const response = await fetch("/api/reports/summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessions: archive.sessions, books: archive.books, ai }),
      });
      const data = await response.json();
      setReport(data.summary || "报告生成完成");
    } catch {
      setReport(`本阶段完成 ${stats.totalFinished} 次阅读，当前在读 ${stats.currentlyReading} 本。`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="page-copy-group">
          <p className="eyebrow">READING INSIGHTS</p>
          <h1>阅读统计</h1>
          <p className="muted">把阅读节奏、日历记录和阶段报告放在同一页，像一份简洁的阅读仪表盘。</p>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <span>2026 阅读轨迹</span>
          <strong>{stats.yearFinished}</strong>
        </div>
        <div className="stat">
          <span>平均每周阅读量</span>
          <strong>{weeklyAverage}</strong>
        </div>
        <div className="stat">
          <span>本月已读</span>
          <strong>{stats.monthFinished}</strong>
        </div>
      </section>

      <section className="ai-settings-form">
        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>阅读趋势</h2>
              <p className="muted">用最近 6 个月的完成量看阅读节奏，而不是单看列表。</p>
            </div>
            <div className="month-switcher">
              <button type="button" className="month-nav" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="查看上个月">
                ←
              </button>
              <button type="button" className="month-display" onClick={openMonthPicker} aria-label={`选择月份，当前为${monthLabel}`}>
                <span>月份</span>
                <strong>{monthLabel}</strong>
              </button>
              <button type="button" className="month-nav" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="查看下个月">
                →
              </button>
              <input
                ref={pickerRef}
                className="month-native"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="trend-bars">
            {trend.map((item) => (
              <div className="trend-item" key={item.label}>
                <div className="bar" style={{ height: `${Math.max(8, item.count * 12)}px` }} />
                <strong>{item.count}</strong>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>阅读日历</h2>
              <p className="muted">日期格保持固定高度，内容较多时点开查看独立弹层。</p>
            </div>
          </div>
          <div className="calendar-grid">
            {days.map((date) => {
              const titles = booksFor(date);
              const hasTitles = titles.length > 0;

              return (
                <button
                  className={`calendar-day ${hasTitles ? "has-reading" : ""}`}
                  key={date}
                  type="button"
                  disabled={!hasTitles}
                  onClick={() => setSelectedDay(date)}
                  aria-label={hasTitles ? `${date} 有 ${titles.length} 条记录，点击展开` : `${date} 无阅读记录`}
                >
                  <small>{date.slice(-2)}</small>
                  {hasTitles ? (
                    <>
                      <span className="calendar-day-count">{titles.length} 条记录</span>
                      <div className="calendar-day-preview">
                        {titles.slice(0, 2).map((title) => (
                          <span key={title}>{title}</span>
                        ))}
                      </div>
                      {titles.length > 2 && <em>点击展开</em>}
                    </>
                  ) : (
                    <span className="calendar-day-empty">暂无</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>阶段性阅读报告</h2>
              <p className="muted">基于真实阅读会话生成，保留原有生成逻辑。</p>
            </div>
            <button className="primary" onClick={generateReport} disabled={loading}>
              {loading ? "生成中…" : "生成本阶段报告"}
            </button>
          </div>
          {report && <p className="topic-overview-art">{report}</p>}
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>最近完成</h2>
              <p className="muted">按最近完成时间查看最近的阅读闭环。</p>
            </div>
          </div>
          {recentFinished.length ? (
            <div className="topic-list">
              {recentFinished.map((session) => (
                <div className="history-row" key={session.id}>
                  <strong>{archive.books.find((book) => book.id === session.bookId)?.title || "未命名书籍"}</strong>
                  <span>{session.finishedAt || "日期未知"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">暂无完成记录。</p>
          )}
        </div>
      </section>

      {selectedDay && (
        <div className="calendar-modal-backdrop" role="presentation" onClick={() => setSelectedDay(null)}>
          <section className="calendar-modal" role="dialog" aria-modal="true" aria-label="日期详情" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-modal-head">
              <div>
                <p className="eyebrow">DAY VIEW</p>
                <h3>{dayFormatter.format(new Date(`${selectedDay}T12:00:00`))}</h3>
              </div>
              <button type="button" className="calendar-modal-close" onClick={() => setSelectedDay(null)} aria-label="关闭">
                ×
              </button>
            </div>
            <p className="muted">共 {selectedBooks.length} 条阅读记录</p>
            <div className="calendar-modal-list">
              {selectedBooks.map((title, index) => (
                <div className="calendar-modal-item" key={`${title}-${index}`}>
                  {title}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <BottomNav active="analytics" />
    </main>
  );
}
