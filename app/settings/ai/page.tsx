"use client";
import { useEffect, useState } from "react";

export default function AISettings() {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("deepseek-chat");
  const [baseUrl, setBaseUrl] = useState("");
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem("reading-archive-ai-config") || "{}"); setProvider(v.provider || "openai"); setModel(v.model || "deepseek-chat"); setBaseUrl(v.baseUrl || ""); setKey(v.key || ""); } catch {} }, []);
  function save(e: React.FormEvent) { e.preventDefault(); localStorage.setItem("reading-archive-ai-config", JSON.stringify({ provider, model, baseUrl, key })); setSaved(true); }
  return <main className="shell"><p className="eyebrow">AI PROVIDER</p><h1>AI 服务配置</h1><form className="stat auth-card" onSubmit={save}><label>服务商<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="openai">OpenAI 兼容接口</option><option value="deepseek">DeepSeek</option><option value="custom">自定义服务商</option></select></label><label>API Base URL<input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1"/></label><label>API Key<input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="留空则使用服务端环境变量"/></label><button className="primary full">保存配置</button>{saved&&<p className="muted">配置已保存在当前浏览器，不会写入代码仓库。</p>}<p className="muted">书籍信息查询会优先使用外部书籍 API；AI 配置用于后续信息解析、笔记和主题生成。</p></form></main>;
}
