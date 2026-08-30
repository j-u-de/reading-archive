import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase 未配置" }, { status: 503 });
  try {
    const { refreshToken } = await request.json();
    if (typeof refreshToken !== "string" || !refreshToken) return NextResponse.json({ error: "缺少 refresh token" }, { status: 400 });
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: refreshToken }) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error_description || "刷新登录态失败" }, { status: 401 });
    return NextResponse.json({ accessToken: data.access_token, refreshToken: data.refresh_token, user: data.user });
  } catch { return NextResponse.json({ error: "认证服务暂不可用" }, { status: 503 }); }
}
