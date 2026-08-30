import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase 未配置" }, { status: 503 });
  try {
    const { email, password } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || password.length < 6) return NextResponse.json({ error: "请输入有效邮箱和至少 6 位密码" }, { status: 400 });
    const response = await fetch(`${url}/auth/v1/signup`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.msg || data.error_description || "注册失败" }, { status: 400 });
    return NextResponse.json({ accessToken: data.access_token || null, refreshToken: data.refresh_token || null, user: data.user || data, confirmationRequired: !data.access_token });
  } catch { return NextResponse.json({ error: "认证服务暂不可用", retryable: true }, { status: 503 }); }
}
