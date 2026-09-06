"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, BookOpen, Download, Palette, Save, Sparkles } from "lucide-react";
import BottomNav from "../../components/bottom-nav";
import { aiFetch } from "../../lib/ai-client";
import {
  ARCHIVE_UPDATED_EVENT,
  ArchiveData,
  PosterRecord,
  PosterStyleFingerprint,
  PosterTypography,
  createEmptyArchive,
  clearPosterAssets,
  migrateArchiveAssets,
  readArchive,
  readCoverAsset,
  readPosterAsset,
  savePosterAsset,
  writeArchive,
} from "../../lib/archive";
import type { PosterVisualDirection } from "../../lib/poster-spec";

type PosterTone = "calm" | "warm" | "night";
type PosterDraft = {
  heading: string;
  subtitle: string;
  highlight: string;
  value: string;
  cta: string;
  tags: string[];
};
type PosterVisualBrief = {
  prompt: string;
  style: string;
  mood: string;
  palette: string[];
  composition: string;
  negativePrompt: string;
  direction?: PosterVisualDirection;
  fingerprint?: {
    book_type: string;
    narrative_mode: string;
    space_type: string;
    subject_type: string;
    light_type: string;
    color_mood: string;
    material_focus: string;
    emotion_tone: string;
    visual_symbol: string;
    visual_climate: PosterStyleFingerprint["visual_climate"];
    composition_mode: PosterStyleFingerprint["composition_mode"];
    color_persona: string;
  };
  qualityScore?: number;
};
type PosterSurfaceTone = "light" | "dark";
type PosterStyleKey = "poetic" | "narrative" | "essay" | "modern";

const toneMeta: Record<
  PosterTone,
  { label: string; bg: string; accent: string; soft: string; text: string; frame: string }
> = {
  calm: { label: "清爽", bg: "#f4f7f4", accent: "#356b58", soft: "#dceae4", text: "#18221d", frame: "#ffffff" },
  warm: { label: "暖调", bg: "#f6efe5", accent: "#a26532", soft: "#f0ddc9", text: "#231911", frame: "#fff8f0" },
  night: { label: "夜读", bg: "#10151b", accent: "#7ab0ff", soft: "#1a2430", text: "#edf3ff", frame: "#151d27" },
};

const statusLabel: Record<string, string> = {
  WANT_TO_READ: "未读",
  READING: "在读",
  FINISHED: "已读",
  PAUSED: "暂停",
};

const defaultDraft = (title: string, author?: string, description?: string): PosterDraft => ({
  heading: title,
  subtitle: author ? `${author} · 阅读海报` : "阅读海报",
  highlight: description || "把这一段阅读，整理成一张可以保存的海报。",
  value: "这本书适合被当作一张可收藏的阅读海报来理解。",
  cta: "继续阅读",
  tags: ["阅读", "记录", "书架"],
});

const shouldStorePosterAsset = (value?: string) => Boolean(value && value.startsWith("data:") && value.length > 120_000);
const posterFinalAssetKey = (posterId: string) => `poster:${posterId}:final`;
const posterBackgroundAssetKey = (posterId: string) => `poster:${posterId}:background`;
const posterPlaceholder =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='600'%20height='900'%20viewBox='0%200%20600%20900'%3E%3Crect%20width='600'%20height='900'%20fill='%23edf2ee'/%3E%3Ccircle%20cx='160'%20cy='190'%20r='90'%20fill='%23d3e2d9'/%3E%3Ccircle%20cx='460'%20cy='720'%20r='130'%20fill='%23d9e6df'/%3E%3Ctext%20x='300'%20y='450'%20text-anchor='middle'%20font-family='sans-serif'%20font-size='28'%20fill='%236b7d72'%3E%E6%B5%B7%E6%8A%A5%E8%AF%BB%E5%8F%96%E4%B8%AD%3C/text%3E%3C/svg%3E";

const typographyProfiles: Record<PosterStyleKey, PosterTypography> = {
  poetic: {
    titleFont: '"Kaiti SC","STKaiti","KaiTi","SimKai","Songti SC","STSong",serif',
    subtitleFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    bodyFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    quoteFont: '"Kaiti SC","STKaiti","KaiTi","SimKai","Songti SC",serif',
    accentFont: '"Kaiti SC","STKaiti","KaiTi","SimKai","Songti SC",serif',
    tagFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    titleWeight: 900,
    titleSpacing: -0.045,
  },
  narrative: {
    titleFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    subtitleFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    bodyFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    quoteFont: '"Kaiti SC","STKaiti","KaiTi","SimKai","Songti SC",serif',
    accentFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    tagFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    titleWeight: 900,
    titleSpacing: -0.03,
  },
  essay: {
    titleFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    subtitleFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    bodyFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    quoteFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    accentFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    tagFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    titleWeight: 850,
    titleSpacing: -0.02,
  },
  modern: {
    titleFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    subtitleFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    bodyFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    quoteFont: '"Songti SC","STSong","SimSun","Noto Serif CJK SC",serif',
    accentFont: '"Georgia","Times New Roman",serif',
    tagFont: '"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
    titleWeight: 850,
    titleSpacing: -0.03,
  },
};

function inferPosterStyleKey(
  book: { title: string; author?: string; description?: string },
  draft: PosterDraft | null,
  visual: PosterVisualBrief | null,
  tone: PosterTone,
): PosterStyleKey {
  const text = [book.title, book.author, book.description, draft?.heading, draft?.subtitle, draft?.highlight, visual?.style, visual?.mood, visual?.composition, tone]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/(诗|散文|抒情|记忆|梦|美学|艺术|书信|随笔|文学)/.test(text)) return "poetic";
  if (/(小说|人物|命运|关系|叙事|故事|城市|荒诞|孤独|戏剧)/.test(text)) return "narrative";
  if (/(哲学|思想|方法|历史|社会|纪实|研究|管理|认知|科学|经济|政治)/.test(text)) return "essay";
  return tone === "night" ? "modern" : "essay";
}

function resolvePosterTypography(
  book: { title: string; author?: string; description?: string },
  draft: PosterDraft | null,
  visual: PosterVisualBrief | null,
  tone: PosterTone,
  saved?: PosterTypography,
) {
  return saved || typographyProfiles[inferPosterStyleKey(book, draft, visual, tone)];
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ch === "\n") {
      if (line) lines.push(line);
      line = "";
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch === " " ? "" : ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function sampleImageSurfaceTone(img: HTMLImageElement): PosterSurfaceTone {
  const canvas = document.createElement("canvas");
  const width = 56;
  const height = Math.max(56, Math.round((img.height / Math.max(img.width, 1)) * width));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "light";

  try {
    ctx.drawImage(img, 0, 0, width, height);
    const sample = ctx.getImageData(Math.floor(width * 0.08), Math.floor(height * 0.12), Math.floor(width * 0.78), Math.floor(height * 0.58));
    let total = 0;
    let count = 0;
    for (let i = 0; i < sample.data.length; i += 4) {
      const alpha = sample.data[i + 3];
      if (!alpha) continue;
      total += sample.data[i] * 0.2126 + sample.data[i + 1] * 0.7152 + sample.data[i + 2] * 0.0722;
      count += 1;
    }
    const brightness = count ? total / count : 255;
    return brightness >= 150 ? "light" : "dark";
  } catch {
    return "light";
  }
}

function trimToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let output = text;
  while (output.length > 1 && ctx.measureText(`${output}…`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}…`;
}

function drawSoftWash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  inner: string,
  outer: string,
) {
  const wash = ctx.createRadialGradient(x, y, Math.max(8, radius * 0.12), x, y, radius);
  wash.addColorStop(0, inner);
  wash.addColorStop(0.6, outer);
  wash.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 900, 1350);
}

async function posterToDataUrl(
  book: { title: string; author?: string },
  draft: PosterDraft,
  tone: PosterTone,
  typography: PosterTypography,
  backgroundUrl?: string,
) {
  if (backgroundUrl) return backgroundUrl;

  const theme = toneMeta[tone];
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, theme.bg);
  bg.addColorStop(1, tone === "night" ? "#0b1117" : "#eef3ef");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = tone === "night" ? "rgba(122,176,255,.10)" : "rgba(53,107,88,.08)";
  ctx.beginPath();
  ctx.arc(140, 180, 140, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(760, 240, 180, 0, Math.PI * 2);
  ctx.fill();
  drawSoftWash(
    ctx,
    200,
    280,
    420,
    tone === "night" ? "rgba(8,12,18,.26)" : "rgba(255,255,255,.28)",
    "rgba(255,255,255,0)",
  );
  drawSoftWash(
    ctx,
    560,
    760,
    520,
    tone === "night" ? "rgba(8,12,18,.16)" : "rgba(255,255,255,.16)",
    "rgba(255,255,255,0)",
  );
  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export default function PosterPage() {
  const [archive, setArchive] = useState<ArchiveData>(createEmptyArchive());
  const [selectedBookId, setSelectedBookId] = useState("");
  const [tone, setTone] = useState<PosterTone>("calm");
  const [draft, setDraft] = useState<PosterDraft | null>(null);
  const [visual, setVisual] = useState<PosterVisualBrief | null>(null);
  const [posterImageUrl, setPosterImageUrl] = useState("");
  const [savedPosterImageUrl, setSavedPosterImageUrl] = useState("");
  const [posterAssets, setPosterAssets] = useState<Record<string, string>>({});
  const [coverAssets, setCoverAssets] = useState<Record<string, string>>({});
  const [posterSurfaceTone, setPosterSurfaceTone] = useState<PosterSurfaceTone>("light");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const raw = readArchive();
      const data = await migrateArchiveAssets(raw);
      if (cancelled) return;
      setArchive(data);
      setSelectedBookId((current) => (data.books.some((book) => book.id === current) ? current : data.books[0]?.id || ""));
      if (data !== raw) writeArchive(data);
    }
    void sync();
    window.addEventListener("storage", sync);
    window.addEventListener(ARCHIVE_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(ARCHIVE_UPDATED_EVENT, sync);
      cancelled = true;
    };
  }, []);

  const selectedBook = useMemo(
    () => archive.books.find((book) => book.id === selectedBookId) || archive.books[0],
    [archive.books, selectedBookId],
  );
  const selectedSession = useMemo(
    () => selectedBook ? archive.sessions.find((session) => session.bookId === selectedBook.id) : undefined,
    [archive.sessions, selectedBook],
  );
  const selectedPoster = useMemo(
    () => (selectedSession ? archive.posters.find((poster) => poster.sessionId === selectedSession.id) : undefined),
    [archive.posters, selectedSession],
  );
  const posterTypography = useMemo(
    () => resolvePosterTypography(selectedBook || { title: "" }, draft, visual, tone, selectedPoster?.typography),
    [draft, selectedBook, selectedPoster?.typography, tone, visual],
  );

  useEffect(() => {
    if (!selectedBook && archive.books[0]) setSelectedBookId(archive.books[0].id);
  }, [archive.books, selectedBook]);

  useEffect(() => {
    const previewSource = posterImageUrl || savedPosterImageUrl;
    let cancelled = false;
    async function updateSurfaceTone() {
      if (!previewSource) {
        setPosterSurfaceTone(tone === "night" ? "dark" : "light");
        return;
      }
      const img = await loadImage(previewSource);
      if (cancelled) return;
      setPosterSurfaceTone(img ? sampleImageSurfaceTone(img) : tone === "night" ? "dark" : "light");
    }
    void updateSurfaceTone();
    return () => {
      cancelled = true;
    };
  }, [posterImageUrl, savedPosterImageUrl, tone]);

  useEffect(() => {
    const postersWithEmbeddedImages = archive.posters.filter((poster) => shouldStorePosterAsset(poster.imageDataUrl) || shouldStorePosterAsset(poster.backgroundImageUrl));
    if (!postersWithEmbeddedImages.length) return;
    let cancelled = false;
    async function migratePosterAssets() {
      const nextPosters = await Promise.all(archive.posters.map(async (poster) => {
        const imageStoreKey = poster.imageStoreKey || (shouldStorePosterAsset(poster.imageDataUrl) ? posterFinalAssetKey(poster.id) : undefined);
        const backgroundStoreKey = poster.backgroundStoreKey || (shouldStorePosterAsset(poster.backgroundImageUrl) ? posterBackgroundAssetKey(poster.id) : undefined);
        if (imageStoreKey && poster.imageDataUrl) await savePosterAsset(imageStoreKey, poster.imageDataUrl);
        if (backgroundStoreKey && poster.backgroundImageUrl) await savePosterAsset(backgroundStoreKey, poster.backgroundImageUrl);
        return {
          ...poster,
          imageStoreKey,
          backgroundStoreKey,
          imageDataUrl: imageStoreKey ? "" : poster.imageDataUrl,
          backgroundImageUrl: backgroundStoreKey ? undefined : poster.backgroundImageUrl,
        };
      }));
      if (cancelled) return;
      const next = { ...archive, posters: nextPosters };
      setArchive(next);
      writeArchive(next);
    }
    void migratePosterAssets().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [archive]);

  useEffect(() => {
    const keys = Array.from(new Set(archive.books.map((book) => book.coverStoreKey).filter((key): key is string => Boolean(key))));
    const missingCoverKeys = keys.filter((key) => !coverAssets[key]);
    if (missingCoverKeys.length) {
      let cancelled = false;
      const loadCovers = async () => {
        const entries = await Promise.all(missingCoverKeys.map(async (key) => [key, await readCoverAsset(key)] as const));
        if (cancelled) return;
        setCoverAssets((current) => {
          const next = { ...current };
          entries.forEach(([key, value]) => {
            if (value) next[key] = value;
          });
          return next;
        });
      };
      void loadCovers();
      return () => {
        cancelled = true;
      };
    }
  }, [archive.books, coverAssets]);

  useEffect(() => {
    const keys = Array.from(new Set(archive.posters.flatMap((poster) => [poster.imageStoreKey, poster.backgroundStoreKey].filter(Boolean) as string[])));
    const missing = keys.filter((key) => !posterAssets[key]);
    if (!missing.length) return;
    let cancelled = false;
    async function loadAssets() {
      const entries = await Promise.all(missing.map(async (key) => [key, await readPosterAsset(key)] as const));
      if (cancelled) return;
      setPosterAssets((current) => {
        const next = { ...current };
        entries.forEach(([key, value]) => {
          if (value) next[key] = value;
        });
        return next;
      });
    }
    void loadAssets();
    return () => {
      cancelled = true;
    };
  }, [archive.posters, posterAssets]);

  useEffect(() => {
    if (selectedPoster) {
      setDraft(selectedPoster.draft ? {
        heading: selectedPoster.draft.heading,
        subtitle: selectedPoster.draft.subtitle,
        highlight: selectedPoster.draft.highlight,
        value: selectedPoster.draft.value || "这本书适合被当作一张可收藏的阅读海报来理解。",
        cta: selectedPoster.draft.cta,
        tags: [...selectedPoster.draft.tags],
      } : null);
      setVisual(selectedPoster.visual ? {
        prompt: selectedPoster.visual.prompt,
        style: selectedPoster.visual.style,
        mood: selectedPoster.visual.mood,
        palette: [...selectedPoster.visual.palette],
        composition: selectedPoster.visual.composition,
        negativePrompt: selectedPoster.visual.negativePrompt,
        direction: selectedPoster.visual.direction ? { ...selectedPoster.visual.direction } : undefined,
        fingerprint: selectedPoster.visual.fingerprint ? { ...selectedPoster.visual.fingerprint } : undefined,
        qualityScore: selectedPoster.visual.qualityScore,
      } : null);
      setPosterImageUrl(selectedPoster.backgroundImageUrl || (selectedPoster.backgroundStoreKey ? posterAssets[selectedPoster.backgroundStoreKey] || "" : ""));
      setSavedPosterImageUrl(selectedPoster.imageDataUrl || (selectedPoster.imageStoreKey ? posterAssets[selectedPoster.imageStoreKey] || "" : ""));
      return;
    }
    setDraft(null);
    setVisual(null);
    setPosterImageUrl("");
    setSavedPosterImageUrl("");
  }, [selectedBookId, selectedPoster, posterAssets]);

  const posterDraft = draft || (selectedBook ? defaultDraft(selectedBook.title, selectedBook.author, selectedBook.description) : null);
  async function persistPosterRecord(
    imageDataUrl: string,
    options: {
      backgroundImageUrl?: string;
      draft: PosterDraft;
      visual: PosterVisualBrief | null;
      typography: PosterTypography;
    },
  ) {
    if (!selectedBook) return;
    const sessionId = selectedSession?.id || selectedBook.id;
    const existing = archive.posters.find((item) => item.sessionId === sessionId);
    const posterId = existing?.id || crypto.randomUUID();
    const imageStoreKey = shouldStorePosterAsset(imageDataUrl) ? posterFinalAssetKey(posterId) : undefined;
    const backgroundStoreKey = shouldStorePosterAsset(options.backgroundImageUrl) ? posterBackgroundAssetKey(posterId) : undefined;
    if (imageStoreKey) await savePosterAsset(imageStoreKey, imageDataUrl);
    if (backgroundStoreKey && options.backgroundImageUrl) await savePosterAsset(backgroundStoreKey, options.backgroundImageUrl);
    setPosterAssets((current) => ({
      ...current,
      ...(imageStoreKey ? { [imageStoreKey]: imageDataUrl } : {}),
      ...(backgroundStoreKey && options.backgroundImageUrl ? { [backgroundStoreKey]: options.backgroundImageUrl } : {}),
    }));
    const poster: PosterRecord = {
      id: posterId,
      sessionId,
      imageDataUrl: imageDataUrl,
      imageStoreKey,
      createdAt: existing?.createdAt || new Date().toISOString(),
      backgroundImageUrl: undefined,
      backgroundStoreKey,
      draft: options.draft,
      visual: options.visual || undefined,
      typography: options.typography,
      tone,
    };
    const next = {
      ...archive,
      posters: [poster, ...archive.posters.filter((item) => item.sessionId !== poster.sessionId)],
    };
    setArchive(next);
    writeArchive(next);
    setSavedPosterImageUrl(imageDataUrl);
    setMessage("海报已自动保存到我的海报。");
  }

  async function generatePoster() {
    if (!selectedBook) return;
    setBusy(true);
    setMessage("");
    try {
      const existingVisuals = archive.posters
        .map((poster) => {
          const session = archive.sessions.find((item) => item.id === poster.sessionId);
          const book = archive.books.find((item) => item.id === session?.bookId);
          return book ? {
            title: book.title,
            prompt: poster.visual?.prompt || "",
            style: poster.visual?.style || "",
            mood: poster.visual?.mood || "",
            composition: poster.visual?.composition || "",
            palette: poster.visual?.palette || [],
            direction: poster.visual?.direction,
            fingerprint: poster.visual?.fingerprint,
          } : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const response = await aiFetch("/api/ai/poster", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: selectedBook.title,
          author: selectedBook.author,
          description: selectedBook.description,
          tone: toneMeta[tone].label,
          existingVisuals,
        }),
      });
      const data = await response.json();
      const backgroundImageUrl = typeof data.imageUrl === "string" ? data.imageUrl : "";
      const nextDraft = {
        heading: String(data.heading || selectedBook.title),
        subtitle: String(data.subtitle || selectedBook.author || "阅读海报"),
        highlight: String(data.highlight || selectedBook.description || "把这一段阅读，整理成一张可以保存的海报。"),
        value: String(data.value || "这本书适合被当作一张可收藏的阅读海报来理解。"),
        cta: String(data.cta || "继续阅读"),
        tags: Array.isArray(data.tags) ? data.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
      };
      const nextVisual = data.visual ? {
        prompt: String(data.visual.prompt || ""),
        style: String(data.visual.style || ""),
        mood: String(data.visual.mood || ""),
        palette: Array.isArray(data.visual.palette) ? data.visual.palette.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
        composition: String(data.visual.composition || ""),
        negativePrompt: String(data.visual.negativePrompt || ""),
        direction: data.visual.direction ? {
          core_theme: String(data.visual.direction.core_theme || ""),
          core_emotion: String(data.visual.direction.core_emotion || ""),
          representative_scene: String(data.visual.direction.representative_scene || ""),
          visual_metaphor: String(data.visual.direction.visual_metaphor || ""),
          recommended_color: String(data.visual.direction.recommended_color || ""),
          recommended_composition: String(data.visual.direction.recommended_composition || ""),
          main_subject: String(data.visual.direction.main_subject || ""),
          banned_visual_tropes: Array.isArray(data.visual.direction.banned_visual_tropes) ? data.visual.direction.banned_visual_tropes.map((item: unknown) => String(item).trim()).filter(Boolean) : [],
        } : undefined,
        fingerprint: data.visual.fingerprint ? {
          book_type: String(data.visual.fingerprint.book_type || ""),
          narrative_mode: String(data.visual.fingerprint.narrative_mode || ""),
          space_type: String(data.visual.fingerprint.space_type || ""),
          subject_type: String(data.visual.fingerprint.subject_type || ""),
          light_type: String(data.visual.fingerprint.light_type || ""),
          color_mood: String(data.visual.fingerprint.color_mood || ""),
          material_focus: String(data.visual.fingerprint.material_focus || ""),
          emotion_tone: String(data.visual.fingerprint.emotion_tone || ""),
          visual_symbol: String(data.visual.fingerprint.visual_symbol || ""),
          visual_climate: (String(data.visual.fingerprint.visual_climate || "") || "neutral_real") as PosterStyleFingerprint["visual_climate"],
          composition_mode: (String(data.visual.fingerprint.composition_mode || "") || "film_scene") as PosterStyleFingerprint["composition_mode"],
          color_persona: String(data.visual.fingerprint.color_persona || ""),
        } as PosterStyleFingerprint : undefined,
        qualityScore: typeof data.visual.qualityScore === "number" ? data.visual.qualityScore : undefined,
      } : null;
      const nextTypography = resolvePosterTypography(selectedBook, nextDraft, nextVisual, tone, posterTypography);
      setDraft(nextDraft);
      setVisual(nextVisual);
      setPosterImageUrl(backgroundImageUrl);
      const finalPosterUrl = await posterToDataUrl(selectedBook, nextDraft, tone, nextTypography, backgroundImageUrl);
      await persistPosterRecord(finalPosterUrl, {
        draft: nextDraft,
        visual: nextVisual,
        typography: nextTypography,
      });
      setMessage(backgroundImageUrl ? "海报已按书籍主题生成并自动保存。" : "海报文案已生成，图像使用了本地回退背景，并已自动保存。");
    } catch {
      const nextDraft = defaultDraft(selectedBook.title, selectedBook.author, selectedBook.description);
      const nextVisual = {
        prompt: `为《${selectedBook.title}》生成无文字阅读海报背景`,
        style: toneMeta[tone].label,
        mood: "安静",
        palette: [toneMeta[tone].accent],
        composition: "竖版构图",
        negativePrompt: "文字、封面、UI、水印",
        direction: undefined,
      };
      const nextTypography = resolvePosterTypography(selectedBook, nextDraft, nextVisual, tone, posterTypography);
      setDraft(nextDraft);
      setVisual(nextVisual);
      setPosterImageUrl("");
      const finalPosterUrl = await posterToDataUrl(selectedBook, nextDraft, tone, nextTypography);
      await persistPosterRecord(finalPosterUrl, {
        draft: nextDraft,
        visual: nextVisual,
        typography: nextTypography,
      });
      setMessage("AI 暂不可用，已使用本地文案与本地回退背景，并已自动保存。");
    } finally {
      setBusy(false);
    }
  }

  async function exportPoster() {
    if (!selectedBook || !posterDraft) return null;
    if (savedPosterImageUrl) return savedPosterImageUrl;
    if (selectedPoster?.imageStoreKey) {
      const stored = posterAssets[selectedPoster.imageStoreKey] || (await readPosterAsset(selectedPoster.imageStoreKey));
      if (stored) return stored;
    }
    return posterToDataUrl(selectedBook, posterDraft, tone, posterTypography, posterImageUrl);
  }

  async function handleDownload() {
    const dataUrl = await exportPoster();
    if (!dataUrl) return;
    downloadDataUrl(dataUrl, `${selectedBook?.title || "reading-poster"}.png`);
  }

  async function handleSave() {
    if (!selectedBook || !posterDraft) return;
    setSaving(true);
    try {
      const dataUrl = await exportPoster();
      if (!dataUrl) return;
      await persistPosterRecord(dataUrl, {
        draft: selectedPoster?.draft ? {
          heading: selectedPoster.draft.heading,
          subtitle: selectedPoster.draft.subtitle,
          highlight: selectedPoster.draft.highlight,
          value: selectedPoster.draft.value || "这本书适合被当作一张可收藏的阅读海报来理解。",
          cta: selectedPoster.draft.cta,
          tags: selectedPoster.draft.tags,
        } : posterDraft,
        visual: selectedPoster?.visual || visual,
        typography: selectedPoster?.typography || posterTypography,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearPosters() {
    setSaving(true);
    try {
      await clearPosterAssets();
      const next = { ...archive, posters: [] };
      setArchive(next);
      setDraft(null);
      setVisual(null);
      setPosterImageUrl("");
      setSavedPosterImageUrl("");
      setPosterAssets({});
      writeArchive(next);
      setMessage("已清理已生成海报，书籍和封面数据已保留。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell poster-shell">
      <div className="topbar">
        <div>
          <p className="eyebrow">POSTER STUDIO</p>
          <h1>阅读海报</h1>
        </div>
        <Link href="/" className="text-button">
          <ArrowLeft size={16} />
          返回书架
        </Link>
      </div>

      <section className="poster-layout">
        <div className="poster-sidebar stat">
          <h2>选择一本书</h2>
          <p className="muted">先选书，再生成海报文案，最后保存或下载成图片。</p>

          <div className="poster-tone">
            {(
              [
                ["calm", "清爽"],
                ["warm", "暖调"],
                ["night", "夜读"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={tone === key ? "selected" : ""}
                onClick={() => setTone(key)}
              >
                <Palette size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="poster-list">
            {archive.books.map((book) => {
              const session = archive.sessions.find((item) => item.bookId === book.id);
              const active = book.id === selectedBook?.id;
              const coverSrc = book.coverUrl || (book.coverStoreKey ? coverAssets[book.coverStoreKey] : "");
              return (
                <button
                  key={book.id}
                  type="button"
                  className={`poster-book ${active ? "selected" : ""}`}
                  onClick={() => setSelectedBookId(book.id)}
                >
                  <div className="poster-book-cover">{coverSrc ? <img src={coverSrc} alt="" /> : <BookOpen size={22} />}</div>
                  <div className="poster-book-meta">
                    <strong>{book.title}</strong>
                    <span>{book.author || "未知作者"}</span>
                    <small>{statusLabel[session?.status || "WANT_TO_READ"] || "未记录"}</small>
                  </div>
                </button>
              );
            })}
          </div>

          {!archive.books.length && (
            <div className="empty poster-empty">
              <div className="empty-icon">
                <BookOpen size={34} />
              </div>
              <h2>先添加一本书</h2>
              <p>海报功能会基于你的书籍数据生成。</p>
              <Link href="/" className="primary">
                去书架添加
              </Link>
            </div>
          )}
        </div>

        <div className="poster-main stat">
          <div className="poster-toolbar">
            <div>
              <span className="eyebrow">AI 生成</span>
              <h2>{selectedBook ? selectedBook.title : "未选择书籍"}</h2>
            </div>
            <div className="poster-actions">
              <button className="primary" onClick={generatePoster} disabled={busy || !selectedBook}>
                <Sparkles size={16} />
                {busy ? "生成中…" : "生成海报"}
              </button>
              <button className="secondary-card" onClick={handleDownload} disabled={!selectedBook}>
                <Download size={16} />
                下载 PNG
              </button>
              <button className="secondary-card" onClick={handleSave} disabled={!selectedBook || saving}>
                <Save size={16} />
                {saving ? "保存中…" : "保存海报"}
              </button>
            </div>
          </div>

          {message && <p className="status-message">{message}</p>}

          {selectedBook && posterDraft && (
            <div className={`poster-preview-card poster-preview-legacy poster-tone-${tone}`}>
              {(savedPosterImageUrl || posterImageUrl) ? (
                <img className="poster-preview-legacy-image" src={savedPosterImageUrl || posterImageUrl} alt={`${selectedBook.title} 海报`} />
              ) : (
                <div className="poster-preview-empty">
                  <BookOpen size={28} />
                  <p>生成后在这里显示海报</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="stat poster-gallery">
        <div className="poster-gallery-head">
          <div>
            <h2>我的海报</h2>
            {selectedPoster && <p className="muted">当前书籍已保存海报，可以继续覆盖更新。</p>}
          </div>
          <button className="danger" type="button" onClick={handleClearPosters} disabled={!archive.posters.length || saving}>
            清理已生成海报
          </button>
        </div>
        <div className="poster-grid">
          {archive.posters.map((poster) => {
            const session = archive.sessions.find((item) => item.id === poster.sessionId);
            const book = archive.books.find((item) => item.id === session?.bookId);
            if (!book) return null;
            return (
              <figure className="poster-thumb" key={poster.id}>
                <img
                  src={
                    poster.imageDataUrl ||
                    (poster.imageStoreKey ? posterAssets[poster.imageStoreKey] : "") ||
                    posterPlaceholder
                  }
                  alt={`${book.title} 海报`}
                />
                <figcaption>
                  <strong>{book.title}</strong>
                  <span>{book.author || "未知作者"}</span>
                </figcaption>
              </figure>
            );
          })}
          {!archive.posters.length && <p className="muted">还没有保存海报。</p>}
        </div>
      </section>

      <BottomNav active="poster" />
    </main>
  );
}
