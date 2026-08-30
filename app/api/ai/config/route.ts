import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY), provider: process.env.AI_PROVIDER || "openai", model: process.env.AI_MODEL || "deepseek-chat", baseUrl: process.env.AI_BASE_URL || "" });
}
