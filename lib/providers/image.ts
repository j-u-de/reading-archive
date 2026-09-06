import { buildPosterImagePrompt, buildPosterNegativePrompt, type PosterCompositionMode, type PosterStyleFingerprint, type PosterVisualClimate, type PosterVisualDirection } from "../poster-spec";
import type { AIRequestConfig } from "./ai";

export interface ImageAIProvider {
  generateBackground(input: {
    title: string;
    author?: string;
    description?: string;
    themes?: string[];
    prompt?: string;
    style?: string;
    mood?: string;
    composition?: string;
    negativePrompt?: string;
    tone?: string;
    direction?: PosterVisualDirection;
    existingVisuals?: Array<{
      title?: string;
      prompt?: string;
      style?: string;
      mood?: string;
      composition?: string;
      palette?: string[];
      fingerprint?: {
        book_type?: string;
        narrative_mode?: string;
        space_type?: string;
        subject_type?: string;
        light_type?: string;
        color_mood?: string;
        material_focus?: string;
        emotion_tone?: string;
        visual_symbol?: string;
        visual_climate?: PosterVisualClimate;
        composition_mode?: PosterCompositionMode;
        color_persona?: string;
      };
    }>;
  }): Promise<{ url: string; prompt: string }>;
}

function resolveImageConfig(overrides?: AIRequestConfig) {
  return {
    baseUrl: (overrides?.imageBaseUrl || process.env.IMAGE_AI_BASE_URL || process.env.IMAGE_AI_DASHSCOPE_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    key: overrides?.imageKey || process.env.IMAGE_AI_API_KEY || process.env.IMAGE_AI_DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY || "",
    model: overrides?.imageModel || process.env.IMAGE_AI_MODEL || process.env.IMAGE_AI_DASHSCOPE_MODEL || "gpt-image-1",
  };
}

function isDashScopeConfig(config: { baseUrl: string; model: string }) {
  return /dashscope\.aliyuncs\.com/i.test(config.baseUrl) || /^qwen-image/i.test(config.model);
}

function buildImageEndpoint(config: { baseUrl: string; model: string }) {
  if (/\/services\/aigc\/multimodal-generation\/generation\/?$/i.test(config.baseUrl)) {
    return config.baseUrl;
  }
  if (isDashScopeConfig(config)) {
    return `${config.baseUrl.replace(/\/$/, "")}/services/aigc/multimodal-generation/generation`;
  }
  if (/\/images\/generations\/?$/i.test(config.baseUrl)) {
    return config.baseUrl;
  }
  return `${config.baseUrl.replace(/\/$/, "")}/images/generations`;
}

function toDataUrl(buffer: ArrayBuffer, mimeType = "image/png") {
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function colorFromHash(seed: number, offset = 0) {
  const hue = (seed * 37 + offset * 53) % 360;
  const sat = 48 + (seed % 18);
  const light = 34 + ((seed >> 2) % 16);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

function buildFallbackDataUrl(input: {
  title: string;
  themes?: string[];
  style?: string;
  mood?: string;
  tone?: string;
}) {
  const seed = hashText([input.title, input.themes?.join(","), input.style, input.mood, input.tone].filter(Boolean).join("|"));
  const c1 = colorFromHash(seed, 1);
  const c2 = colorFromHash(seed, 2);
  const c3 = colorFromHash(seed, 3);
  const c4 = colorFromHash(seed, 4);
  const c5 = colorFromHash(seed, 5);
  const c6 = colorFromHash(seed, 6);
  const a = 120 + (seed % 140);
  const b = 160 + ((seed >> 2) % 180);
  const c = 700 + ((seed >> 3) % 120);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="52%" stop-color="${c2}" />
        <stop offset="100%" stop-color="${c3}" />
      </linearGradient>
      <radialGradient id="mist" cx="50%" cy="42%" r="62%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.26)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="34" /></filter>
      <filter id="soft"><feGaussianBlur stdDeviation="16" /></filter>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="2" seed="${seed % 97}" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 0.06" />
        </feComponentTransfer>
      </filter>
      <pattern id="grid" width="96" height="96" patternUnits="userSpaceOnUse">
        <path d="M 96 0 L 0 0 0 96" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <circle cx="18" cy="18" r="2.2" fill="rgba(255,255,255,0.12)" />
        <circle cx="66" cy="62" r="1.8" fill="rgba(255,255,255,0.08)" />
      </pattern>
      <pattern id="stripes" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
        <rect width="64" height="64" fill="transparent" />
        <rect x="0" y="0" width="12" height="64" fill="rgba(255,255,255,0.06)" />
        <rect x="28" y="0" width="4" height="64" fill="rgba(255,255,255,0.08)" />
      </pattern>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" />
    <rect width="1024" height="1024" fill="url(#grid)" opacity="0.34" />
    <rect width="1024" height="1024" fill="url(#stripes)" opacity="0.18" />
    <rect width="1024" height="1024" fill="url(#mist)" opacity="0.7" />
    <circle cx="${a}" cy="${b}" r="148" fill="${c4}" opacity="0.36" filter="url(#blur)" />
    <circle cx="${930 - (seed % 170)}" cy="${240 + ((seed >> 3) % 140)}" r="204" fill="${c2}" opacity="0.24" filter="url(#blur)" />
    <circle cx="${240 + (seed % 160)}" cy="${830 - ((seed >> 4) % 160)}" r="210" fill="${c5}" opacity="0.21" filter="url(#blur)" />
    <path d="M 88 724 C 244 560, 378 812, 550 628 S 834 572, 948 702" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="28" stroke-linecap="round" filter="url(#soft)" />
    <path d="M 98 292 C 250 206, 398 320, 540 244 S 790 176, 944 286" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="22" stroke-linecap="round" filter="url(#soft)" />
    <path d="M 164 172 C 312 98, 450 160, 578 130 S 800 108, 900 168" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="12" stroke-linecap="round" filter="url(#soft)" />
    <path d="M 176 860 C 324 778, 452 838, 604 756 S 844 722, 904 806" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="12" stroke-linecap="round" filter="url(#soft)" />
    <rect x="88" y="120" width="848" height="784" rx="56" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" />
    <g opacity="0.56">
      <circle cx="258" cy="430" r="74" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="2" />
      <circle cx="682" cy="408" r="112" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2" />
      <circle cx="572" cy="650" r="156" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
      <path d="M 186 498 L 322 442 L 420 560 L 308 648 Z" fill="${c6}" opacity="0.16" />
      <path d="M 644 256 L 740 334 L 682 456 L 582 394 Z" fill="${c4}" opacity="0.16" />
      <path d="M 96 360 H 420 M 96 392 H 382 M 96 424 H 340" stroke="rgba(255,255,255,0.14)" stroke-width="2" stroke-linecap="round" />
      <path d="M 616 748 H 916 M 616 782 H 872 M 616 816 H 834" stroke="rgba(255,255,255,0.12)" stroke-width="2" stroke-linecap="round" />
    </g>
    <rect x="122" y="154" width="180" height="12" rx="6" fill="rgba(255,255,255,0.2)" />
    <rect x="122" y="182" width="286" height="8" rx="4" fill="rgba(255,255,255,0.12)" />
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function fetchRemoteAsDataUrl(url: string) {
  const response = await fetch(url, { headers: { accept: "image/*" } });
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  return toDataUrl(await response.arrayBuffer(), response.headers.get("content-type") || "image/png");
}

class FallbackImageAIProvider implements ImageAIProvider {
  async generateBackground(input: { title: string; themes?: string[]; prompt?: string; style?: string; mood?: string; composition?: string; negativePrompt?: string; tone?: string; direction?: PosterVisualDirection; existingVisuals?: Array<{ title?: string; prompt?: string; style?: string; mood?: string; composition?: string; palette?: string[]; fingerprint?: Partial<PosterStyleFingerprint>; direction?: Partial<PosterVisualDirection> }> }) {
    return {
      url: buildFallbackDataUrl({
        title: input.title,
        themes: input.themes,
        style: input.style || input.tone,
        mood: input.mood,
        tone: input.tone,
      }),
      prompt: input.prompt || `为《${input.title}》生成无文字阅读海报背景图`,
    };
  }
}

class OpenAIImageProvider implements ImageAIProvider {
  private fallback = new FallbackImageAIProvider();
  private config?: AIRequestConfig;

  constructor(config?: AIRequestConfig) {
    this.config = config;
  }

  async generateBackground(input: { title: string; author?: string; description?: string; themes?: string[]; prompt?: string; style?: string; mood?: string; composition?: string; negativePrompt?: string; tone?: string; direction?: PosterVisualDirection; existingVisuals?: Array<{ title?: string; prompt?: string; style?: string; mood?: string; composition?: string; palette?: string[]; fingerprint?: Partial<PosterStyleFingerprint>; direction?: Partial<PosterVisualDirection> }> }) {
    const config = resolveImageConfig(this.config);
    const prompt = buildPosterImagePrompt({
      title: input.title,
      description: [input.description, input.prompt, input.composition].filter(Boolean).join("。"),
      themes: input.themes,
      tone: input.tone,
      direction: input.direction,
      existingVisuals: input.existingVisuals,
    });

    if (!config.key) {
      return this.fallback.generateBackground({ ...input, prompt });
    }

    try {
      const endpoint = buildImageEndpoint(config);
      const body = isDashScopeConfig(config)
        ? {
            model: config.model,
            input: {
              messages: [
                {
                  role: "user",
                  content: [{ text: prompt }],
                },
              ],
            },
            parameters: {
              prompt_extend: true,
              enable_thinking: true,
            },
            size: "1024*1536",
            n: 1,
            negative_prompt: input.negativePrompt || buildPosterNegativePrompt({ title: input.title, description: input.description, themes: input.themes, tone: input.tone, direction: input.direction }),
          }
        : {
            model: config.model,
            prompt,
            size: "1024x1536",
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.key}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Image API ${response.status}: ${text.slice(0, 1000)}`);

      const payload = JSON.parse(text);
      if (isDashScopeConfig(config)) {
        const dashItem = payload?.output?.choices?.[0]?.message?.content?.find?.((item: any) => typeof item?.image === "string" || typeof item?.url === "string" || typeof item?.b64_json === "string");
        if (typeof dashItem?.b64_json === "string" && dashItem.b64_json) {
          return { url: `data:image/png;base64,${dashItem.b64_json}`, prompt };
        }
        if (typeof dashItem?.image === "string" && dashItem.image) {
          const imageValue = dashItem.image.startsWith("http") || dashItem.image.startsWith("data:") ? dashItem.image : `data:image/png;base64,${dashItem.image}`;
          if (imageValue.startsWith("http")) {
            return { url: await fetchRemoteAsDataUrl(imageValue), prompt };
          }
          return { url: imageValue, prompt };
        }
        if (typeof dashItem?.url === "string" && dashItem.url) {
          return { url: await fetchRemoteAsDataUrl(dashItem.url), prompt };
        }
      } else {
        const item = payload?.data?.[0];
        if (typeof item?.b64_json === "string" && item.b64_json) {
          return { url: `data:image/png;base64,${item.b64_json}`, prompt };
        }
        if (typeof item?.url === "string" && item.url) {
          return { url: await fetchRemoteAsDataUrl(item.url), prompt };
        }
      }
      return this.fallback.generateBackground({ ...input, prompt });
    } catch {
      return this.fallback.generateBackground({ ...input, prompt });
    }
  }
}

export function createImageAIProvider(config?: AIRequestConfig): ImageAIProvider {
  return new OpenAIImageProvider(config);
}

export const imageAIProvider: ImageAIProvider = createImageAIProvider();
