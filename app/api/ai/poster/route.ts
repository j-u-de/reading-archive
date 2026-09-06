import { NextResponse } from "next/server";
import { createTextAIProvider, readAIConfigFromRequest } from "../../../../lib/providers/ai";
import { createImageAIProvider } from "../../../../lib/providers/image";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const config = readAIConfigFromRequest(req);
    const existingVisuals = Array.isArray(body.existingVisuals) ? body.existingVisuals.slice(0, 12) : [];
    const ai = createTextAIProvider(config);
    const poster = await ai.generatePoster({
      title: body.title.trim().slice(0, 200),
      author: typeof body.author === "string" ? body.author.trim().slice(0, 200) : undefined,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 600) : undefined,
      tone: typeof body.tone === "string" ? body.tone.trim().slice(0, 40) : undefined,
      existingVisuals,
    });
    const visual = await ai.generatePosterVisualBrief({
      title: body.title.trim().slice(0, 200),
      author: typeof body.author === "string" ? body.author.trim().slice(0, 200) : undefined,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 600) : undefined,
      tone: typeof body.tone === "string" ? body.tone.trim().slice(0, 40) : undefined,
      themes: poster.tags,
      existingVisuals,
    });
    const image = await createImageAIProvider(config).generateBackground({
      title: body.title.trim().slice(0, 200),
      author: typeof body.author === "string" ? body.author.trim().slice(0, 200) : undefined,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 600) : undefined,
      tone: typeof body.tone === "string" ? body.tone.trim().slice(0, 40) : undefined,
      themes: poster.tags,
      prompt: visual.prompt,
      style: visual.style,
      mood: visual.mood,
      composition: visual.composition,
      negativePrompt: visual.negativePrompt,
      direction: visual.direction,
      existingVisuals,
    });
    return NextResponse.json({ ...poster, visual, imageUrl: image.url, imagePrompt: image.prompt, version: 2 });
  } catch {
    return NextResponse.json({ error: "AI 服务暂不可用", retryable: true }, { status: 503 });
  }
}
