"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "登录失败");
      localStorage.setItem("reading-archive-auth", JSON.stringify(data));
      router.push("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell auth-shell">
      <header className="page-copy-group">
        <p className="eyebrow">READING ARCHIVE</p>
        <h1>进入你的私人书房</h1>
        <p className="muted">登录后可以继续同步云端数据，但本地书架仍然可用。</p>
      </header>

      <form className="auth-card" onSubmit={submit}>
        <label>
          邮箱
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          密码
          <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <button className="primary full" disabled={busy}>
          {busy ? "登录中…" : "登录"}
        </button>
        {message && <p className="status-message">{message}</p>}
      </form>
    </main>
  );
}
