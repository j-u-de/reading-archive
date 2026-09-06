"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ImagePlus, Sparkles } from "lucide-react";

export default function AISettingsPage() {
  const [provider, setProvider] = useState("deepseek");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [baseUrl, setBaseUrl] = useState("https://api.deepseek.com");
  const [key, setKey] = useState("");
  const [imageModel, setImageModel] = useState("gpt-image-1");
  const [imageBaseUrl, setImageBaseUrl] = useState("https://api.openai.com/v1");
  const [imageKey, setImageKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const config = JSON.parse(localStorage.getItem("reading-archive-ai-config") || "{}");
      setProvider(config.provider || "deepseek");
      setModel(config.model || "deepseek-v4-flash");
      setBaseUrl(config.baseUrl || "https://api.deepseek.com");
      setKey(config.key || "");
      setImageModel(config.imageModel || "gpt-image-1");
      setImageBaseUrl(config.imageBaseUrl || "https://api.openai.com/v1");
      setImageKey(config.imageKey || "");
    } catch {}
  }, []);

  function save(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem(
      "reading-archive-ai-config",
      JSON.stringify({ provider, model, baseUrl, key, imageModel, imageBaseUrl, imageKey }),
    );
    setSaved(true);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="page-copy-group">
          <p className="eyebrow">AI PROVIDER</p>
          <h1>AI 服务配置</h1>
          <p className="muted">文本模型负责解析与分析，图像模型负责海报生成。两条链路分开配置，不改变既有能力。</p>
        </div>
        <Link className="text-button" href="/settings">
          <ArrowLeft size={16} />
          返回设置
        </Link>
      </header>

      <form className="ai-settings-form" onSubmit={save}>
        <section className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>
                <Sparkles size={18} /> 文本 AI
              </h2>
              <p className="muted">用于书籍解析、笔记、主题和分析。</p>
            </div>
          </div>
          <div className="ai-settings-grid">
            <label>
              服务商
              <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="openai">OpenAI 兼容接口</option>
                <option value="deepseek">DeepSeek</option>
                <option value="custom">自定义服务商</option>
              </select>
            </label>
            <label>
              模型
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="deepseek-v4-flash" />
            </label>
            <label className="wide">
              API Base URL
              <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.deepseek.com" />
            </label>
            <label className="wide">
              API Key
              <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="留空则使用服务端环境变量" />
            </label>
          </div>
        </section>

        <section className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>
                <ImagePlus size={18} /> 图像模型
              </h2>
              <p className="muted">用于阅读海报生成，支持千问 3.0 或其他兼容接口。</p>
            </div>
          </div>
          <div className="ai-settings-grid">
            <label>
              生图模型
              <input list="image-model-options" value={imageModel} onChange={(e) => setImageModel(e.target.value)} placeholder="gpt-image-1" />
              <datalist id="image-model-options">
                <option value="gpt-image-1" />
                <option value="dall-e-3" />
                <option value="flux-1.1-pro" />
                <option value="qwen-image-3.0-pro" />
              </datalist>
            </label>
            <label>
              图像 Base URL
              <input value={imageBaseUrl} onChange={(e) => setImageBaseUrl(e.target.value)} placeholder="https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation" />
            </label>
            <label className="wide">
              图像 Key
              <input type="password" value={imageKey} onChange={(e) => setImageKey(e.target.value)} placeholder="填写可生成图像的密钥" />
            </label>
          </div>
          <p className="field-hint">
            如果你用的是千问 3.0 生图，模型填 `qwen-image-3.0-pro`，Base URL 填
            `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`，Key 填你的
            `DASHSCOPE_API_KEY`。
          </p>
        </section>

        <section className="ai-settings-section">
          <div className="section-head">
            <div>
              <h2>保存</h2>
              <p className="muted">配置只保存在当前浏览器，不会写入代码仓库。</p>
            </div>
          </div>
          <button className="primary full">保存配置</button>
          {saved && <p className="muted">配置已保存。</p>}
          <p className="muted">书籍信息查询会优先使用外部书籍 API；文本 AI 用于笔记、主题和分析，图像模型用于海报生图。</p>
        </section>
      </form>
    </main>
  );
}
