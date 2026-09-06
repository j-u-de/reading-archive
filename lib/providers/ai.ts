import {
  buildPosterImagePrompt,
  buildPosterAnalysisPrompt,
  buildPosterDirectionAnalysisPrompt,
  buildPosterDirectionDedupePrompt,
  buildPosterDedupePrompt,
  buildPosterSpecPrompt,
  type PosterCompositionMode,
  type PosterStyleFingerprint,
  type PosterVisualDirection,
  type PosterVisualClimate,
  inferPosterGenre,
  inferPosterPaletteHints,
  inferPosterSceneProfile,
  inferPosterVisualDirection,
  inferPosterVisualMetaphor,
} from "../poster-spec";

export type ReadingNote = {
  one_sentence_summary: string;
  core_points: string[];
  reading_notes: string;
  insights: string[];
};

export type PosterDraft = {
  heading: string;
  subtitle: string;
  highlight: string;
  value: string;
  cta: string;
  tags: string[];
};

export type PosterVisualBrief = {
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
    visual_climate: PosterVisualClimate;
    composition_mode: PosterCompositionMode;
    color_persona: string;
  };
  qualityScore?: number;
};

export type TopicInsight = {
  label: string;
  weight: number;
  reason: string;
  books: string[];
};

export type TopicAnalysis = {
  overview: string;
  commonThemes: TopicInsight[];
  branches: TopicInsight[];
};

export type AIRequestConfig = {
  provider?: string;
  model?: string;
  baseUrl?: string;
  key?: string;
  imageModel?: string;
  imageBaseUrl?: string;
  imageKey?: string;
};

export function inferPosterSceneHint(input: { title: string; description?: string; themes?: string[]; tone?: string }) {
  return inferPosterVisualMetaphor(input);
}

export const AI_CONFIG_STORAGE_KEY = "reading-archive-ai-config";

export interface TextAIProvider {
  generateReadingNote(input: { title: string; author?: string; reflection?: string }): Promise<ReadingNote>;
  generateTopics(input: { title: string; description?: string }): Promise<string[]>;
  generateTopicAnalysis(input: { books: Array<{ title: string; author?: string; description?: string }> }): Promise<TopicAnalysis>;
  generatePoster(input: { title: string; author?: string; description?: string; tone?: string; existingVisuals?: PosterVisualBrief[] }): Promise<PosterDraft>;
  generatePosterVisualBrief(input: { title: string; author?: string; description?: string; tone?: string; themes?: string[]; existingVisuals?: PosterVisualBrief[] }): Promise<PosterVisualBrief>;
}

export class FallbackTextAIProvider implements TextAIProvider {
  async generateReadingNote(i: { title: string; author?: string; reflection?: string }) {
    return {
      one_sentence_summary: `《${i.title}》的核心内容整理`,
      core_points: ["核心观点待补充", "可结合个人阅读感受继续完善", "建议回顾原书重点章节"],
      reading_notes: i.reflection || "AI 辅助整理的阅读笔记。",
      insights: ["将书中方法与实际生活结合"],
    };
  }

  async generateTopics(_i: { title: string; description?: string }) {
    return ["待分类"];
  }

  async generateTopicAnalysis(input: { books: Array<{ title: string; author?: string; description?: string }> }) {
    const names = input.books.map((book) => book.title).filter(Boolean);
    return {
      overview: names.length
        ? `当前书架的阅读重心集中在方法、经验和主题延展之间。相似主题在多本书中反复出现，不同分支则体现在叙事视角、时代背景和知识路径上。`
        : "当前没有可分析的书籍。",
      commonThemes: [
        { label: "方法与观察", weight: 92, reason: "多本书都在讨论如何理解世界、整理经验或改进行动方式。", books: names.slice(0, 3) },
        { label: "个体经验", weight: 84, reason: "阅读内容普遍落在人物选择、生活处境与个人判断上。", books: names.slice(0, 4) },
        { label: "主题延展", weight: 76, reason: "书与书之间存在可继续扩展的思想线索，而不是完全孤立的主题。", books: names.slice(1, 5) },
        { label: "历史与现实的互文", weight: 72, reason: "书架上的作品经常把个人故事放进更大的时代和社会背景里理解。", books: names.slice(0, 5) },
      ],
      branches: [
        { label: "叙事/文学分支", weight: 64, reason: "偏故事、人物和文学表达的作品更强调情绪与结构。", books: names.slice(0, 2) },
        { label: "现实/社会分支", weight: 58, reason: "关注社会结构、现实处境与群体经验的书更接近分析型阅读。", books: names.slice(2, 5) },
        { label: "知识/方法分支", weight: 52, reason: "侧重知识整理、方法论和认知框架的书形成另一条阅读路径。", books: names.slice(1, 4) },
        { label: "情绪/结构分支", weight: 48, reason: "一部分作品更在意情绪推进和表达方式，另一部分则更强调结构和论证路径。", books: names.slice(0, 5) },
      ],
    };
  }

  async generatePoster(i: { title: string; author?: string; description?: string; tone?: string; existingVisuals?: PosterVisualBrief[] }) {
    return {
      heading: i.title,
      subtitle: `${i.author || "未知作者"} · 阅读海报`,
      highlight: i.description || "把今天读到的内容，变成一张可以保存的阅读海报。",
      value: "这本书适合被当作一张可收藏的阅读海报来理解。",
      cta: "继续阅读",
      tags: ["阅读", "书单", "记录"],
    };
  }

  async generatePosterVisualBrief(i: { title: string; author?: string; description?: string; tone?: string; themes?: string[]; existingVisuals?: PosterVisualBrief[] }) {
    const profile = inferPosterSceneProfile(i);
    const direction = inferPosterVisualDirection(i);
    const themeLine = i.themes?.length ? `主题关键词：${i.themes.slice(0, 5).join("、")}。` : "";
    return {
      prompt: buildPosterImagePrompt({
        title: i.title,
        description: `${themeLine}${i.description || ""}`,
        tone: i.tone,
        themes: i.themes,
        direction,
        existingVisuals: i.existingVisuals,
      }),
      style: i.tone || "克制",
      mood: "稳定、含蓄、具叙事感",
      palette: inferPosterGenre({ title: i.title, description: i.description, themes: i.themes, tone: i.tone }) === "general"
        ? ["米白", "暖灰", "深墨色"]
        : inferPosterPaletteHints({ title: i.title, description: i.description, themes: i.themes, tone: i.tone }).split("，").slice(0, 3),
      composition: profile.composition,
      negativePrompt: profile.negativePrompt,
      fingerprint: profile.fingerprint,
      direction,
      qualityScore: 82,
    };
  }
}

export function readAIConfigFromRequest(request?: Request): AIRequestConfig {
  const raw = request?.headers.get("x-reading-archive-ai-config");
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw)) as AIRequestConfig;
  } catch {
    return {};
  }
}

function resolveDeepSeekConfig(overrides?: AIRequestConfig) {
  return {
    baseUrl: (overrides?.baseUrl || process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, ""),
    key: overrides?.key || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "",
    model: overrides?.model || process.env.AI_MODEL || "deepseek-v4-flash",
  };
}

function parseJsonContent(raw: string) {
  const text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(text);
  } catch {}
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  throw new Error("model did not return valid JSON");
}

function normalizeCompactText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/gi, "");
}

function overlapScore(a: string, b: string) {
  const left = normalizeCompactText(a);
  const right = normalizeCompactText(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.92;
  const leftChars = new Set(left.split(""));
  const rightChars = new Set(right.split(""));
  let hit = 0;
  leftChars.forEach((ch) => {
    if (rightChars.has(ch)) hit += 1;
  });
  return hit / Math.max(leftChars.size, rightChars.size);
}

function formatDirectionConflictSummary(item: PosterVisualBrief) {
  const direction = item.direction;
  const palette = direction?.recommended_color || item.palette?.join("/");
  const scene = direction?.representative_scene || item.composition || item.prompt;
  const subject = direction?.main_subject || item.fingerprint?.subject_type || item.fingerprint?.visual_symbol;
  const composition = direction?.recommended_composition || item.composition || item.fingerprint?.composition_mode;
  return {
    tone: `${palette || item.fingerprint?.color_mood || ""} ${item.fingerprint?.color_persona || ""}`.trim(),
    scene: String(scene || ""),
    composition: String(composition || ""),
    subject: String(subject || ""),
  };
}

function findDirectionConflict(direction: PosterVisualDirection, existingVisuals?: PosterVisualBrief[]) {
  const visuals = existingVisuals || [];
  for (const item of visuals) {
    const summary = formatDirectionConflictSummary(item);
    const toneHit = overlapScore(direction.recommended_color, summary.tone);
    const sceneHit = overlapScore(direction.representative_scene, summary.scene);
    const compositionHit = overlapScore(direction.recommended_composition, summary.composition);
    const subjectHit = overlapScore(direction.main_subject, summary.subject);
    const matched = [toneHit, sceneHit, compositionHit, subjectHit].filter((score) => score >= 0.58).length;
    if (matched >= 3) {
      return { item, toneHit, sceneHit, compositionHit, subjectHit };
    }
  }
  return null;
}

function normalizeDirectionValue(input: any, fallback: PosterVisualDirection): PosterVisualDirection {
  const banned = Array.isArray(input?.banned_visual_tropes)
    ? input.banned_visual_tropes.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];
  return {
    core_theme: String(input?.core_theme || fallback.core_theme).trim(),
    core_emotion: String(input?.core_emotion || fallback.core_emotion).trim(),
    representative_scene: String(input?.representative_scene || fallback.representative_scene).trim(),
    visual_metaphor: String(input?.visual_metaphor || fallback.visual_metaphor).trim(),
    recommended_color: String(input?.recommended_color || fallback.recommended_color).trim(),
    recommended_composition: String(input?.recommended_composition || fallback.recommended_composition).trim(),
    main_subject: String(input?.main_subject || fallback.main_subject).trim(),
    banned_visual_tropes: banned.length ? banned : fallback.banned_visual_tropes,
  };
}

export async function callDeepSeek(
  body: Record<string, unknown>,
  overrides?: AIRequestConfig,
  options?: { timeoutMs?: number },
) {
  const config = resolveDeepSeekConfig(overrides);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 20000);
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: controller.signal,
    body: JSON.stringify(body),
  });
  clearTimeout(timeout);
  const text = await response.text();
  if (!response.ok) throw new Error(`DeepSeek API ${response.status}: ${text.slice(0, 1000)}`);
  return JSON.parse(text);
}

class DeepSeekProvider implements TextAIProvider {
  private fallback = new FallbackTextAIProvider();
  private config?: AIRequestConfig;

  constructor(config?: AIRequestConfig) {
    this.config = config;
  }

  private async ask(prompt: string) {
    const d = await callDeepSeek(
      {
        model: this.config?.model || process.env.AI_MODEL || "deepseek-v4-flash",
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "你是阅读档案助手，只返回合法 JSON，不要 Markdown。" },
          { role: "user", content: prompt },
        ],
      },
      this.config,
    );
    return parseJsonContent(d.choices?.[0]?.message?.content || "{}");
  }

  async generateReadingNote(i: { title: string; author?: string; reflection?: string }) {
    try {
      return await this.ask(`为《${i.title}》${i.author || ""}生成阅读笔记 JSON，字段 one_sentence_summary(string), core_points(string[]), reading_notes(string), insights(string[])。`);
    } catch (error) {
      console.error("DeepSeek request failed", error);
      return this.fallback.generateReadingNote(i);
    }
  }

  async generateTopics(i: { title: string; description?: string }) {
    try {
      const d = await this.ask(`为书籍《${i.title}》${i.description || ""}提取 3-5 个主题，返回 JSON {topics:string[]}`);
      return Array.isArray(d.topics) ? d.topics : [];
    } catch {
      return this.fallback.generateTopics(i);
    }
  }

  async generateTopicAnalysis(input: { books: Array<{ title: string; author?: string; description?: string }> }) {
    const bookLines = input.books
      .slice(0, 24)
      .map((book, index) => {
        const title = book.title?.trim() || `未命名 ${index + 1}`;
        const author = book.author?.trim() ? ` / ${book.author.trim()}` : "";
        const description = book.description?.trim() ? `：${book.description.trim().slice(0, 160)}` : "";
        return `${index + 1}. 《${title}》${author}${description}`;
      })
      .join("\n");

    try {
      const fallback = await this.fallback.generateTopicAnalysis(input);
      const d = await this.ask(
        `请根据以下书架内容做分析，目标不是关键词罗列，而是对整本书架做主题解读。返回 JSON：
{
  "overview": "2-4句总结整个书架的阅读重心、共性和差异",
  "commonThemes": [
    {"label":"共性主题","weight":90,"reason":"为什么它们相似","books":["涉及的书名"]}
  ],
  "branches": [
    {"label":"分支方向","weight":70,"reason":"为什么形成分支","books":["涉及的书名"]}
  ]
}
要求：
1. commonThemes 至少 4 个，branches 至少 4 个。
2. label 必须是主题短语或判断短语，不能只是单个名词，也不要输出 "成长/人生/方法/阅读/主题/故事/文学/情感/经验" 这类泛化词。
3. reason 必须是完整分析句，要明确解释这些书为什么会被归到一起，或者为什么形成分支。
4. books 必须来自下列书名，且每个条目尽量给出 2-5 本书，不要让所有条目都指向同一组书。
5. commonThemes 写出书架中反复出现的共性，branches 写出明显分叉出的路径、张力或阅读方向。
6. 至少有一部分条目要点出对比关系，例如人物/社会、叙事/方法、历史/现实、经验/结构、情绪/认知。

书架内容：
${bookLines}`,
      );

      const genericLabels = new Set([
        "成长",
        "人生",
        "方法",
        "阅读",
        "主题",
        "故事",
        "文学",
        "情感",
        "经验",
        "思考",
        "世界",
        "社会",
        "历史",
        "认知",
      ]);

      const isTooGeneric = (label: string) => {
        const compact = label.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");
        return compact.length <= 2 || genericLabels.has(compact);
      };

      const normalize = (items: unknown[], fallbackItems: TopicInsight[]): TopicInsight[] => {
        const merged = new Map<string, TopicInsight>();
        (Array.isArray(items) ? items : fallbackItems)
          .map((item: any) => ({
            label: String(item?.label || "").trim(),
            weight: Number(item?.weight || 60),
            reason: String(item?.reason || "").trim(),
            books: Array.isArray(item?.books) ? item.books.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 6) : [],
          }))
          .filter((item) => item.label && item.reason && !isTooGeneric(item.label))
          .forEach((item) => {
            const key = item.label.toLocaleLowerCase();
            const existing = merged.get(key);
            if (!existing) {
              merged.set(key, item);
              return;
            }
            merged.set(key, {
              label: existing.label,
              weight: Math.max(existing.weight, item.weight),
              reason: existing.reason.length >= item.reason.length ? existing.reason : item.reason,
              books: Array.from(new Set([...existing.books, ...item.books])).slice(0, 6),
            });
          });

        const normalized = Array.from(merged.values()).slice(0, 6);
        return normalized.length >= 4 ? normalized : fallbackItems;
      };

      return {
        overview: String(d.overview || "").trim() || fallback.overview,
        commonThemes: normalize(d.commonThemes, fallback.commonThemes),
        branches: normalize(d.branches, fallback.branches),
      };
    } catch {
      return this.fallback.generateTopicAnalysis(input);
    }
  }

  async generatePoster(i: { title: string; author?: string; description?: string; tone?: string; existingVisuals?: PosterVisualBrief[] }) {
    try {
      const profile = inferPosterSceneProfile({ title: i.title, description: i.description, tone: i.tone });
      const d = await this.ask(`为书籍《${i.title}》${i.author || ""}${i.description || ""}生成阅读海报文案，返回 JSON {heading:string, subtitle:string, highlight:string, value:string, cta:string, tags:string[]}。要求：遵循出版级阅读海报结构：系列标识、主标题、副标题/核心观点、一句话阅读价值、关键词/分类信息、作者信息。heading 不超过 12 个汉字，subtitle 不超过 20 个字，highlight 40-80 字，value 40-80 字，cta 8-16 个字，tags 提供 3-5 个简短词语。文案必须对应真实场景叙事，而不是信息卡口吻；文字气质要和${profile.scene}、${profile.lighting}、${profile.color}保持一致；标题要像出版物排版的一部分，克制但有力量。整体风格偏${i.tone || "简洁"}。${buildPosterAnalysisPrompt({ title: i.title, author: i.author, description: i.description, tone: i.tone, existingVisuals: i.existingVisuals })}\n${buildPosterSpecPrompt({ title: i.title, author: i.author, description: i.description, tone: i.tone, existingVisuals: i.existingVisuals })}`);
      return {
        heading: String(d.heading || i.title).slice(0, 24),
        subtitle: String(d.subtitle || `${i.author || "未知作者"} · 阅读海报`).slice(0, 32),
        highlight: String(d.highlight || i.description || "把今天读到的内容，变成一张可以保存的阅读海报。").slice(0, 140),
        value: String(d.value || "这本书适合被当作一张可收藏的阅读海报来理解。").slice(0, 160),
        cta: String(d.cta || "继续阅读").slice(0, 24),
        tags: Array.isArray(d.tags) ? d.tags.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 5) : [],
      };
    } catch {
      return this.fallback.generatePoster(i);
    }
  }

  async generatePosterVisualBrief(input: { title: string; author?: string; description?: string; tone?: string; themes?: string[]; existingVisuals?: PosterVisualBrief[] }) {
    const fallback = await this.fallback.generatePosterVisualBrief(input);
    try {
      const profile = inferPosterSceneProfile(input);
      const baseDirection = inferPosterVisualDirection(input);
      const directionPrompt = `${buildPosterDirectionAnalysisPrompt({
        title: input.title,
        author: input.author,
        description: input.description,
        tone: input.tone,
        themes: input.themes,
        existingVisuals: input.existingVisuals,
      })}\n${buildPosterDirectionDedupePrompt({
        title: input.title,
        author: input.author,
        description: input.description,
        tone: input.tone,
        themes: input.themes,
        existingVisuals: input.existingVisuals,
      })}`;

      let analysis = normalizeDirectionValue(
        await this.ask(directionPrompt),
        baseDirection,
      );
      const conflict = findDirectionConflict(analysis, input.existingVisuals);
      if (conflict) {
        analysis = normalizeDirectionValue(
          await this.ask(
            `${buildPosterDirectionAnalysisPrompt({
              title: input.title,
              author: input.author,
              description: input.description,
              tone: input.tone,
              themes: input.themes,
              existingVisuals: input.existingVisuals,
            })}\n当前方案与已有海报过近，请重新生成一个明显不同的视觉方向。\n冲突条目：${formatDirectionConflictSummary(conflict.item).scene}。\n冲突维度：色调、场景、构图、主体至少有三项相似。\n必须改变视觉气质、场景空间、主体选择或构图逻辑。\n${buildPosterDirectionDedupePrompt({
              title: input.title,
              author: input.author,
              description: input.description,
              tone: input.tone,
              themes: input.themes,
              existingVisuals: input.existingVisuals,
            })}`,
          ),
          baseDirection,
        );
      }

      const d = await this.ask(
        `${buildPosterImagePrompt({
          title: input.title,
          author: input.author,
          description: input.description,
          tone: input.tone,
          themes: input.themes,
          direction: analysis,
          existingVisuals: input.existingVisuals,
        })}\n请在最终输出 JSON 中返回：prompt、style、mood、palette(string[])、composition、negativePrompt、fingerprint、qualityScore。`,
      );
      const palette = Array.isArray(d.palette) ? d.palette.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 5) : [];
      const fingerprint = d.fingerprint && typeof d.fingerprint === "object" ? {
        book_type: String((d.fingerprint as any).book_type || profile.fingerprint.book_type),
        narrative_mode: String((d.fingerprint as any).narrative_mode || profile.fingerprint.narrative_mode),
        space_type: String((d.fingerprint as any).space_type || profile.fingerprint.space_type),
        subject_type: String((d.fingerprint as any).subject_type || profile.fingerprint.subject_type),
        light_type: String((d.fingerprint as any).light_type || profile.fingerprint.light_type),
        color_mood: String((d.fingerprint as any).color_mood || profile.fingerprint.color_mood),
        material_focus: String((d.fingerprint as any).material_focus || profile.fingerprint.material_focus),
        emotion_tone: String((d.fingerprint as any).emotion_tone || profile.fingerprint.emotion_tone),
        visual_symbol: String((d.fingerprint as any).visual_symbol || profile.fingerprint.visual_symbol),
        visual_climate: ((d.fingerprint as any).visual_climate || profile.fingerprint.visual_climate) as PosterVisualClimate,
        composition_mode: ((d.fingerprint as any).composition_mode || profile.fingerprint.composition_mode) as PosterCompositionMode,
        color_persona: String((d.fingerprint as any).color_persona || profile.fingerprint.color_persona),
      } : profile.fingerprint;
      return {
        prompt: String(d.prompt || buildPosterImagePrompt({
          title: input.title,
          author: input.author,
          description: input.description,
          tone: input.tone,
          themes: input.themes,
          direction: analysis,
          existingVisuals: input.existingVisuals,
        })).trim().slice(0, 1200),
        style: String(d.style || fallback.style).trim().slice(0, 60),
        mood: String(d.mood || fallback.mood).trim().slice(0, 60),
        palette: palette.length ? palette : fallback.palette,
        composition: String(d.composition || fallback.composition).trim().slice(0, 120),
        negativePrompt: String(d.negativePrompt || fallback.negativePrompt).trim().slice(0, 240),
        fingerprint,
        direction: analysis,
        qualityScore: Number.isFinite(Number((d as any).qualityScore)) ? Math.max(0, Math.min(100, Number((d as any).qualityScore))) : 80,
      };
    } catch {
      return fallback;
    }
  }
}

export function createTextAIProvider(config?: AIRequestConfig): TextAIProvider {
  return new DeepSeekProvider(config);
}

export const textAIProvider: TextAIProvider = createTextAIProvider();
