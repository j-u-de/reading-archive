import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.IMAGE_AI_API_KEY || process.env.IMAGE_AI_DASHSCOPE_API_KEY),
    provider: process.env.AI_PROVIDER || "deepseek",
    model: process.env.AI_MODEL || "deepseek-v4-flash",
    baseUrl: process.env.AI_BASE_URL || "https://api.deepseek.com",
    textConfigured: Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY),
    imageConfigured: Boolean(process.env.IMAGE_AI_API_KEY || process.env.IMAGE_AI_DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY),
    imageModel: process.env.IMAGE_AI_MODEL || process.env.IMAGE_AI_DASHSCOPE_MODEL || "gpt-image-1",
    imageBaseUrl: process.env.IMAGE_AI_BASE_URL || process.env.IMAGE_AI_DASHSCOPE_BASE_URL || "https://api.openai.com/v1",
  });
}
