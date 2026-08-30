import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = request.headers.get("authorization");
  if (!url || !key || !auth) return NextResponse.json({ signedOut: false });
  try {
    const response = await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: { apikey: key, Authorization: auth } });
    return NextResponse.json({ signedOut: response.ok }, { status: response.ok ? 200 : 502 });
  } catch { return NextResponse.json({ signedOut: false, retryable: true }, { status: 503 }); }
}
