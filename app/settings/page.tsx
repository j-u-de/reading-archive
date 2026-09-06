"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, UserRound } from "lucide-react";
import BottomNav from "../../components/bottom-nav";
import { pullArchiveFromSyncSource, readArchive, writeArchive } from "../../lib/archive";

export default function Settings() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncMode, setSyncMode] = useState("检测中");
  const [syncSource, setSyncSource] = useState("本地模式");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const response = await fetch("/api/sync");
        const data = await response.json();
        if (cancelled) return;
        setSyncMode(data.mode === "supabase" ? "云端同步" : "本地模式");
        setSyncSource(data.mode === "supabase" ? "Supabase" : "浏览器本地存储");
      } catch {
        if (!cancelled) {
          setSyncMode("离线");
          setSyncSource("仅本地存储");
        }
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function restore() {
    setBusy(true);
    try {
      const local = readArchive();
      const remote = await pullArchiveFromSyncSource(local);
      const localEmpty = !local.books.length && !local.sessions.length && !local.progressLogs.length && !local.notes.length && !local.topics.length && !local.posters.length;
      const remoteEmpty = !remote.archive.books.length && !remote.archive.sessions.length && !remote.archive.progressLogs.length && !remote.archive.notes.length && !remote.archive.topics.length && !remote.archive.posters.length;
      if (!remote.synced) {
        if (!localEmpty) {
          writeArchive(local);
          setMessage(`同步源不可用，已用本机书架初始化共享存储，共 ${local.books.length} 本书。`);
        } else {
          setMessage("同步源暂不可用，本地数据未受影响。");
        }
        return;
      }
      if (!remote.sourceHasEmbeddedAssets && !localEmpty) {
        writeArchive(local);
        setMessage(`已补齐封面数据并同步，共 ${local.books.length} 本书。`);
        return;
      }
      if (!localEmpty && remoteEmpty) {
        writeArchive(local);
        setMessage(`已将本机书架写入同步存储，当前共有 ${local.books.length} 本书、${local.sessions.length} 次阅读。`);
        return;
      }
      if (remote.archive.books.length || remote.archive.sessions.length || remote.archive.posters.length) {
        writeArchive(remote.archive);
        setMessage(`同步完成，当前共有 ${remote.archive.books.length} 本书、${remote.archive.sessions.length} 次阅读。`);
      } else {
        setMessage("同步源为空，未写入新内容。");
      }
    } catch {
      setMessage("同步失败，本地数据未受影响。");
    } finally {
      setBusy(false);
    }
  }

  function exportData(kind: "json" | "csv") {
    const archive = readArchive();
    const payload =
      kind === "json"
        ? JSON.stringify(archive, null, 2)
        : [
            "title,author,status,startedAt,finishedAt",
            ...archive.sessions.map((session) => {
              const book = archive.books.find((item) => item.id === session.bookId);
              return [book?.title || "", book?.author || "", session.status, session.startedAt || "", session.finishedAt || ""].join(",");
            }),
          ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([payload]));
    link.download = `reading-archive.${kind}`;
    link.click();
    setMessage("导出完成。");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="page-copy-group">
          <p className="eyebrow">PREFERENCES</p>
          <h1>设置中心</h1>
          <p className="muted">集中管理 AI、账户、数据与导出。所有模块都保留在同一套视觉体系里。</p>
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <span>AI 配置</span>
          <strong>2</strong>
        </div>
        <div className="stat">
          <span>数据同步</span>
          <strong>1</strong>
        </div>
        <div className="stat">
          <span>导出方式</span>
          <strong>2</strong>
        </div>
      </section>

      <section className="ai-settings-form">
        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>AI 服务</h2>
              <p className="muted">进入模型配置页，分别设置文本 AI 与图像模型。</p>
            </div>
            <Link className="secondary-card" href="/settings/ai">
              打开配置
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="ai-settings-grid">
            <div className="stat">
              <span>文本 AI</span>
              <strong>DeepSeek</strong>
              <p className="field-hint">用于笔记、主题和分析。</p>
            </div>
            <div className="stat">
              <span>图像模型</span>
              <strong>生图引擎</strong>
              <p className="field-hint">用于阅读海报生成。</p>
            </div>
          </div>
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>账户设置</h2>
              <p className="muted">当前账户保持轻量本地模式，保留登录入口和基础身份信息。</p>
            </div>
            <Link className="secondary-card" href="/login">
              前往登录
              <UserRound size={16} />
            </Link>
          </div>
          <div className="ai-settings-grid">
            <div className="stat">
              <span>当前模式</span>
              <strong>{syncMode}</strong>
            </div>
            <div className="stat">
              <span>同步目标</span>
              <strong>{syncSource}</strong>
            </div>
          </div>
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>数据管理</h2>
              <p className="muted">同步会自动拉取共享档案，导出仍可用于离线备份。</p>
            </div>
            <button className="secondary-card" onClick={restore} disabled={busy}>
              <ShieldCheck size={16} />
              {busy ? "同步中…" : "立即同步"}
            </button>
          </div>
          <div className="ai-settings-grid">
            <button className="stat" onClick={() => exportData("json")}>
              <span>导出档案</span>
              <strong>JSON</strong>
              <p className="field-hint">完整备份当前阅读数据。</p>
            </button>
            <button className="stat" onClick={() => exportData("csv")}>
              <span>导出阅读</span>
              <strong>CSV</strong>
              <p className="field-hint">用于表格查看和迁移。</p>
            </button>
          </div>
        </div>

        <div className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>关于</h2>
              <p className="muted">保留当前产品信息结构，但把外观统一成更成熟的阅读产品。</p>
            </div>
          </div>
          <div className="ai-settings-grid">
            <div className="stat">
              <span>产品定位</span>
              <strong>AI 阅读档案</strong>
            </div>
            <div className="stat">
              <span>外部服务</span>
              <strong>公开信息检索</strong>
            </div>
          </div>
        </div>
      </section>

      {message && <p className="muted" style={{ marginTop: 14 }}>{message}</p>}
      <BottomNav active="settings" />
    </main>
  );
}
