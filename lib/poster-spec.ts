export type PosterGenre = "historical" | "literary" | "business" | "science" | "philosophy" | "growth" | "general";

export type PosterVisualClimate = "bright_open" | "neutral_real" | "low_weight" | "high_contrast_drama";
export type PosterCompositionMode = "center_subject" | "film_scene" | "negative_space" | "environmental_narrative" | "graphic_metaphor";

export type PosterColorPersona = {
  primary: string;
  secondary: string;
  banned: string;
};

export type PosterVisualDirection = {
  core_theme: string;
  core_emotion: string;
  representative_scene: string;
  visual_metaphor: string;
  recommended_color: string;
  recommended_composition: string;
  main_subject: string;
  banned_visual_tropes: string[];
};

export type PosterStyleFingerprint = {
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

export type PosterSceneProfile = {
  genre: PosterGenre;
  scene: string;
  lighting: string;
  atmosphere: string;
  material: string;
  color: string;
  typography: string;
  composition: string;
  fingerprint: PosterStyleFingerprint;
  negativePrompt: string;
};

type PosterSpecInput = {
  title: string;
  author?: string;
  description?: string;
  themes?: string[];
  tone?: string;
  direction?: PosterVisualDirection;
  existingVisuals?: Array<{
    title?: string;
    prompt?: string;
    style?: string;
    mood?: string;
    composition?: string;
    palette?: string[];
    fingerprint?: Partial<PosterStyleFingerprint>;
    direction?: Partial<PosterVisualDirection>;
  }>;
};

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick<T>(items: T[], input: PosterSpecInput, salt = 0) {
  const seed = [input.title, input.author, input.description, input.themes?.join(","), salt].filter(Boolean).join("|");
  return items[(hashText(seed) + salt) % items.length];
}

function getText(input: PosterSpecInput) {
  return [input.title, input.author, input.description, input.themes?.join(" "), input.tone].filter(Boolean).join(" ").toLowerCase();
}

export function inferPosterGenre(input: PosterSpecInput): PosterGenre {
  const text = getText(input);
  if (/(历史|纪实|传记|年代|战争|王朝|文明|考古|档案|回忆录|政治|制度|帝国|革命|红星|万历|资治通鉴|中国历代政治得失)/.test(text)) return "historical";
  if (/(哲学|思想|存在|伦理|意义|反思|自由|荒诞|局外人|鼠疫|尼采|康德|叔本华|加缪)/.test(text)) return "philosophy";
  if (/(小说|文学|诗|散文|抒情|记忆|梦|书信|随笔|艺术|美学|家族|命运|人性|孤独|百年孤独|红楼梦|悲惨世界)/.test(text)) return "literary";
  if (/(商业|管理|投资|创业|经济|组织|营销|战略|企业)/.test(text)) return "business";
  if (/(科普|科学|技术|实验|宇宙|算法|物理|化学|医学|认知|研究)/.test(text)) return "science";
  if (/(成长|自我|习惯|人生|沟通|心理|疗愈|关系|学习|改变)/.test(text)) return "growth";
  return "general";
}

export function inferPosterVisualClimate(input: PosterSpecInput): PosterVisualClimate {
  const text = getText(input);
  if (/(科普|科学|技术|实验|宇宙|自然|成长|温暖|积极|希望|治愈)/.test(text)) return "bright_open";
  if (/(商业|管理|社会|现实|传记|观察|纪实)/.test(text)) return "neutral_real";
  if (/(历史|战争|悲剧|哲学|命运|荒诞|时代压力|沉重|黑暗)/.test(text)) return "low_weight";
  if (/(悬疑|史诗|命运|冲突|灾难|巨变)/.test(text)) return "high_contrast_drama";
  return input.tone?.includes("夜") ? "low_weight" : "neutral_real";
}

export function inferPosterColorPersona(input: PosterSpecInput): PosterColorPersona {
  const genre = inferPosterGenre(input);
  const climate = inferPosterVisualClimate(input);
  if (genre === "historical") return climate === "high_contrast_drama"
    ? { primary: "墨黑", secondary: "暗金", banned: "霓虹蓝" }
    : { primary: "古铜灰", secondary: "玉白", banned: "亮紫" };
  if (genre === "literary") return climate === "bright_open"
    ? { primary: "米白", secondary: "浅黄", banned: "高饱和红" }
    : climate === "high_contrast_drama"
      ? { primary: "灰蓝", secondary: "暗紫", banned: "荧光绿" }
      : { primary: "暖灰", secondary: "雾蓝", banned: "金属银" };
  if (genre === "business") return { primary: "深蓝", secondary: "银灰", banned: "复古棕" };
  if (genre === "science") return { primary: "蓝", secondary: "青紫", banned: "旧纸黄" };
  if (genre === "philosophy") return { primary: "黑白灰", secondary: "冷米色", banned: "亮黄" };
  if (genre === "growth") return { primary: "米白", secondary: "草绿", banned: "深黑" };
  return climate === "bright_open"
    ? { primary: "米白", secondary: "浅青", banned: "棕黑" }
    : { primary: "克制中性色", secondary: "低饱和辅助色", banned: "高饱和撞色" };
}

export function inferPosterCompositionMode(input: PosterSpecInput): PosterCompositionMode {
  const genre = inferPosterGenre(input);
  const text = getText(input);
  if (genre === "historical") return /(战争|冲突|命运|巨变|现场)/.test(text) ? "film_scene" : "environmental_narrative";
  if (genre === "literary") return /(抒情|诗|散文|梦|孤独|信|情绪)/.test(text) ? "negative_space" : "film_scene";
  if (genre === "business") return "graphic_metaphor";
  if (genre === "science") return "graphic_metaphor";
  if (genre === "philosophy") return "negative_space";
  if (genre === "growth") return "environmental_narrative";
  return "film_scene";
}

export function inferPosterSceneProfile(input: PosterSpecInput): PosterSceneProfile {
  const genre = inferPosterGenre(input);
  const climate = inferPosterVisualClimate(input);
  const colorPersona = inferPosterColorPersona(input);
  const compositionMode = inferPosterCompositionMode(input);
  const commonNegative = "UI卡片, 玻璃拟态, PPT感, 商业Banner, 电商海报, 胶囊标签, 大面积文字底板, 半透明蒙层, 社交媒体模板, 单一静物, 普通素材拼贴, 商品摄影感, 水印, logo, 二维码, 低质插画";

  if (genre === "historical") {
    const route = pick([
      {
        mode: "历史档案型",
        scene: "一束斜光照进档案库，尘埃里摊开的卷宗、褪色地图与被压住的信件显示一个时代正在被重新翻开。",
        space: "档案库或博物馆文献室",
        subject: "卷宗、手稿、地图和制度遗物",
        symbol: "被翻开的历史卷宗",
      },
      {
        mode: "历史现场型",
        scene: "雨后的旧城街口或战争现场边缘，残存路牌、墙面裂痕和远处人影共同构成时代转折的一帧。",
        space: "旧城道路、战场边缘或历史现场",
        subject: "建筑遗痕、道路、旗帜阴影和人物剪影",
        symbol: "被时代压弯的道路",
      },
      {
        mode: "历史命运型",
        scene: "深色大厅里，一份公文被推向桌沿，远处门缝透出冷光，像制度与个人命运相撞前的静默。",
        space: "宫廷、议事厅或制度空间",
        subject: "公文、桌沿、门缝冷光和压抑空间",
        symbol: "临界处的制度文件",
      },
    ], input);
    return {
      genre,
      scene: route.scene,
      lighting: "冷侧光、低照度台灯或雨后天光，避免均匀照明。",
      atmosphere: "厚重、克制、带时代压力和命运感。",
      material: "泛黄纸张、旧木、石墙、金属、墨迹、裂纹与胶片颗粒。",
      color: "古铜灰、暗红、羊皮纸色、阴影黑和褪色米白。",
      typography: "标题像馆藏展签、档案编号或高级历史出版物标题，靠留白、比例和对齐建立秩序。",
      composition: "前景放置纸页、石纹或道路细节，中景是核心遗物或人物剪影，背景提供制度空间或历史现场。",
      fingerprint: {
        book_type: "历史纪实",
        narrative_mode: route.mode,
        space_type: route.space,
        subject_type: route.subject,
        light_type: "冷侧光",
        color_mood: "古铜灰",
        material_focus: "纸张、石墙与旧木",
        emotion_tone: "厚重",
        visual_symbol: route.symbol,
        visual_climate: climate,
        composition_mode: compositionMode,
        color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
      },
      negativePrompt: `${commonNegative}, 千篇一律复古书房, 只出现木桌和台灯`,
    };
  }

  if (genre === "literary") {
    const route = pick([
      {
        mode: "抒情文学",
        scene: "黄昏房间里，窗帘被风轻轻带起，未寄出的信和远处天色让人物缺席也有情绪。",
        space: "黄昏房间或窗边空间",
        subject: "窗、信件、背影、风和余晖",
        symbol: "被风掀起的信纸",
        color: "暖灰、雾蓝、黄昏橙与柔和阴影",
      },
      {
        mode: "现实文学",
        scene: "潮湿街巷或普通厨房的一角，生活物件、人影和暗处灯光呈现人与关系被压住的瞬间。",
        space: "街巷、厨房、楼道或日常生活空间",
        subject: "日常器物、人物剪影、墙面痕迹和生活光源",
        symbol: "被使用过的日常器物",
        color: "灰绿、旧白、暗褐和低饱和暖光",
      },
      {
        mode: "史诗文学",
        scene: "宽阔河岸、家族庭院或远方道路在阴云和余光中展开，人物很小但命运空间很大。",
        space: "河岸、庭院、荒野或长路",
        subject: "大空间、家族遗物、远景人物和时代天空",
        symbol: "延伸到远处的道路",
        color: "土色、深绿、云灰和暮色金",
      },
      {
        mode: "魔幻文学",
        scene: "现实街道与不可解释的光影同时出现，普通物件出现轻微超现实偏移，像记忆和神话重叠。",
        space: "现实与超现实交叠的街道或庭院",
        subject: "人物、植物、旧物、异样光影和轻微超现实空间",
        symbol: "现实中偏移的象征物",
        color: "浓绿、金色、暗紫和热带阴影",
      },
    ], input);
    return {
      genre,
      scene: route.scene,
      lighting: "窗边侧光、黄昏逆光、雨天漫反射或局部生活灯光。",
      atmosphere: "人性、命运、孤独、温度与隐秘张力。",
      material: "纸张、布料、玻璃、墙面、木质家具、雨水或旧照片颗粒。",
      color: route.color,
      typography: "标题像文学杂志封面或独立出版物，和场景留白、人物视线或物件方向发生关系。",
      composition: "前景是可触摸的生活细节，中景是人、物或象征动作，背景保留空间延伸和情绪空气。",
      fingerprint: {
        book_type: "文学作品",
        narrative_mode: route.mode,
        space_type: route.space,
        subject_type: route.subject,
        light_type: "情绪侧光",
        color_mood: route.color,
        material_focus: "纸张、布料与生活痕迹",
        emotion_tone: "含蓄有张力",
        visual_symbol: route.symbol,
        visual_climate: climate,
        composition_mode: compositionMode,
        color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
      },
      negativePrompt: `${commonNegative}, 所有文学书都变成窗边暖光, 单一窗户, 空房间无叙事`,
    };
  }

  if (genre === "business") {
    return {
      genre,
      scene: "城市高处的决策空间里，会议桌、玻璃反射、路径图和远处夜景构成一次竞争判断发生前的瞬间。",
      lighting: "屏幕光、冷白顶光和城市反射光。",
      atmosphere: "理性、压力、秩序、竞争和系统感。",
      material: "玻璃、金属、深色木桌、纸张、屏幕反光。",
      color: "深蓝、石墨灰、银色和少量金色。",
      typography: "标题像商业杂志专题封面，清晰、有网格秩序，但不能像报表或App面板。",
      composition: "前景是文件、手部或棋局细节，中景是决策桌面，背景是城市网络或高层空间。",
      fingerprint: {
        book_type: "商业管理",
        narrative_mode: "系统决策型",
        space_type: "城市决策空间",
        subject_type: "会议桌、路径图与城市网络",
        light_type: "屏幕冷光",
        color_mood: "深蓝石墨",
        material_focus: "玻璃与金属",
        emotion_tone: "冷静紧张",
        visual_symbol: "临界决策路径",
        visual_climate: climate,
        composition_mode: compositionMode,
        color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
      },
      negativePrompt: `${commonNegative}, 复古桌面, 手稿, 文学暖光, 表格界面`,
    };
  }

  if (genre === "science") {
    return {
      genre,
      scene: "冷光实验台或深空观测室里，仪器、坐标、微观结构和屏幕反射构成一次靠近未知的瞬间。",
      lighting: "实验室冷光、屏幕光、局部高对比照明。",
      atmosphere: "探索、精密、理性、静默而专注。",
      material: "玻璃、金属、透明容器、样品、屏幕反光。",
      color: "蓝紫、冷白、青灰和少量荧光色。",
      typography: "标题像科学杂志封面，精准清晰，融入坐标、光路或实验空间。",
      composition: "前景是仪器或样本细节，中景是实验主体，背景是实验室、星图或微观/宇宙尺度。",
      fingerprint: {
        book_type: "科普探索",
        narrative_mode: "认知探索型",
        space_type: "实验室或观测空间",
        subject_type: "仪器、坐标和微观结构",
        light_type: "实验冷光",
        color_mood: "冷蓝青灰",
        material_focus: "玻璃与金属",
        emotion_tone: "专注探索",
        visual_symbol: "被照亮的未知结构",
        visual_climate: climate,
        composition_mode: compositionMode,
        color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
      },
      negativePrompt: `${commonNegative}, 平铺结构图, 科幻游戏界面, 说明书感`,
    };
  }

  if (genre === "philosophy") {
    return {
      genre,
      scene: "一条安静长廊、半开的门或镜面边界中，人物与影子保持距离，像思想在边界处停顿。",
      lighting: "长廊尽头冷光、门缝光、镜面反射或低照度侧光。",
      atmosphere: "反思、边界、荒诞、冷静和精神张力。",
      material: "石材、镜面、纸张、墙面、暗色地面。",
      color: "黑白灰、冷米色、深绿或一点低饱和蓝。",
      typography: "标题像思想类出版物，留白克制，和门、影子、镜面边界形成关系。",
      composition: "前景是门槛、地面或镜面边缘，中景是人物/影子/抽象主体，背景是长廊或几何空间。",
      fingerprint: {
        book_type: "哲学思想",
        narrative_mode: "边界反思型",
        space_type: "门、镜面或长廊空间",
        subject_type: "人物、影子和几何边界",
        light_type: "门缝冷光",
        color_mood: "冷灰低饱和",
        material_focus: "石材与镜面",
        emotion_tone: "冷静荒诞",
        visual_symbol: "边界处的人影",
        visual_climate: climate,
        composition_mode: compositionMode,
        color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
      },
      negativePrompt: `${commonNegative}, 空洞抽象渐变, 哲学符号堆砌, 纯几何贴图`,
    };
  }

  if (genre === "growth") {
    return {
      genre,
      scene: "清晨窗边、楼梯或山路入口，一个人刚迈出一步，植物、纸页和光线把改变具体成生活瞬间。",
      lighting: "清晨自然光、窗边斜光或柔和室内光。",
      atmosphere: "向前、修复、缓慢、希望和日常生命力。",
      material: "木材、纸张、植物、织物和轻微磨损痕迹。",
      color: "绿、暖光、米白、浅褐和柔和阴影。",
      typography: "标题像生活方式类出版物，但要有力量，不要像课程海报。",
      composition: "前景是日常器物，中景是人物动作或行走轨迹，背景是窗外光线和空间延伸。",
      fingerprint: {
        book_type: "成长心理",
        narrative_mode: "自我转变型",
        space_type: "窗边、楼梯或路径空间",
        subject_type: "人物动作、植物和日常器物",
        light_type: "清晨斜光",
        color_mood: "温暖自然",
        material_focus: "木材、植物与纸张",
        emotion_tone: "修复向前",
        visual_symbol: "迈出的一步",
        visual_climate: climate,
        composition_mode: compositionMode,
        color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
      },
      negativePrompt: `${commonNegative}, 报名海报感, 鸡汤模板, 课程封面`,
    };
  }

  return {
    genre,
    scene: "一个能体现书籍气质的具体瞬间，带有时间、空间、情绪和叙事，而不是孤立物件摆拍。",
    lighting: "明确自然光或人工光源，避免均匀照明。",
    atmosphere: "克制但有张力，有故事感、时间痕迹和空间关系。",
    material: "纸张、木材、玻璃、金属或织物中的一两种真实材质。",
    color: "根据书籍情绪选择克制配色，避免高饱和撞色和单色平涂。",
    typography: "标题必须作为画面的一部分自然融入，兼顾可读性与整体气质。",
    composition: "前景、中景、背景至少三层，主体明确，场景完整，画面不能只剩一个物件和空白。",
    fingerprint: {
      book_type: "综合阅读",
      narrative_mode: "主题场景型",
      space_type: "与书籍气质一致的具体空间",
      subject_type: "场景主角与环境细节",
      light_type: "明确主光源",
      color_mood: "克制情绪色",
      material_focus: "真实材质",
      emotion_tone: "克制有张力",
      visual_symbol: "核心视觉隐喻",
      visual_climate: climate,
      composition_mode: compositionMode,
      color_persona: `${colorPersona.primary} / ${colorPersona.secondary}（禁用${colorPersona.banned}）`,
    },
    negativePrompt: `${commonNegative}, 模板化大色块, 空洞背景`,
  };
}

export function inferPosterVisualMetaphor(input: PosterSpecInput) {
  return inferPosterSceneProfile(input).scene;
}

export function inferPosterPaletteHints(input: PosterSpecInput) {
  return inferPosterSceneProfile(input).color;
}

export function inferPosterLightingHints(input: PosterSpecInput) {
  return inferPosterSceneProfile(input).lighting;
}

export function inferPosterMaterialHints(input: PosterSpecInput) {
  return inferPosterSceneProfile(input).material;
}

export function inferPosterTypographyHints(input: PosterSpecInput) {
  return inferPosterSceneProfile(input).typography;
}

export function inferPosterCompositionHints(input: PosterSpecInput) {
  return inferPosterSceneProfile(input).composition;
}

export function buildPosterNegativePrompt(input: PosterSpecInput) {
  const profile = inferPosterSceneProfile(input);
  const direction = input.direction || inferPosterVisualDirection(input);
  const tropes = direction.banned_visual_tropes?.length ? direction.banned_visual_tropes.join("、") : "";
  return [profile.negativePrompt, tropes ? `额外禁用：${tropes}` : ""].filter(Boolean).join("，");
}

export function buildPosterFingerprintYaml(input: PosterSpecInput) {
  const fp = inferPosterSceneProfile(input).fingerprint;
  return [
    `book_type: ${fp.book_type}`,
    `narrative_mode: ${fp.narrative_mode}`,
    `space_type: ${fp.space_type}`,
    `subject_type: ${fp.subject_type}`,
    `light_type: ${fp.light_type}`,
    `color_mood: ${fp.color_mood}`,
    `material_focus: ${fp.material_focus}`,
    `emotion_tone: ${fp.emotion_tone}`,
    `visual_symbol: ${fp.visual_symbol}`,
    `visual_climate: ${fp.visual_climate}`,
    `composition_mode: ${fp.composition_mode}`,
    `color_persona: ${fp.color_persona}`,
  ].join("\n");
}

function splitTropes(value?: string) {
  return String(value || "")
    .split(/[、,，；;\n]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function inferPosterVisualDirection(input: PosterSpecInput): PosterVisualDirection {
  const profile = inferPosterSceneProfile(input);
  const fallbackTropes = splitTropes(profile.negativePrompt).slice(0, 6);
  return {
    core_theme: `${profile.fingerprint.book_type}中的${profile.fingerprint.narrative_mode}`,
    core_emotion: profile.atmosphere,
    representative_scene: profile.scene,
    visual_metaphor: profile.fingerprint.visual_symbol,
    recommended_color: profile.color,
    recommended_composition: profile.composition,
    main_subject: profile.fingerprint.subject_type,
    banned_visual_tropes: fallbackTropes.length ? fallbackTropes : ["模板化书房", "单一背景", "空洞渐变"],
  };
}

function formatDirectionSummary(direction?: Partial<PosterVisualDirection>) {
  if (!direction) return "";
  const banned = direction.banned_visual_tropes?.length ? `；禁用=${direction.banned_visual_tropes.join("/")}` : "";
  return [
    direction.core_theme ? `主题=${direction.core_theme}` : "",
    direction.core_emotion ? `情绪=${direction.core_emotion}` : "",
    direction.representative_scene ? `场景=${direction.representative_scene}` : "",
    direction.visual_metaphor ? `隐喻=${direction.visual_metaphor}` : "",
    direction.recommended_color ? `色调=${direction.recommended_color}` : "",
    direction.recommended_composition ? `构图=${direction.recommended_composition}` : "",
    direction.main_subject ? `主体=${direction.main_subject}` : "",
    banned,
  ].filter(Boolean).join("；");
}

function formatVisualSummary(item: NonNullable<PosterSpecInput["existingVisuals"]>[number]) {
  const palette = item.palette?.length ? `；色彩=${item.palette.join("/")}` : "";
  const fingerprint = item.fingerprint?.visual_symbol ? `；符号=${item.fingerprint.visual_symbol}` : "";
  const climate = item.fingerprint?.visual_climate ? `；气候=${item.fingerprint.visual_climate}` : "";
  const composition = item.fingerprint?.composition_mode ? `；构图=${item.fingerprint.composition_mode}` : "";
  const colorPersona = item.fingerprint?.color_persona ? `；色彩人格=${item.fingerprint.color_persona}` : "";
  const direction = formatDirectionSummary(item.direction);
  return `${item.title || "旧海报"}：${item.style || ""}；${item.mood || ""}；${item.composition || ""}${palette}${climate}${composition}${colorPersona}${fingerprint}${direction ? `；方向=${direction}` : ""}；${item.prompt?.slice(0, 160) || ""}`;
}

export function buildPosterDirectionDedupePrompt(input: PosterSpecInput) {
  const visuals = input.existingVisuals?.slice(0, 12) || [];
  if (!visuals.length) {
    return "同批次去重：当前没有可对照的旧海报，但仍要避免默认套路。";
  }
  return [
    "同批次去重：在确定视觉方向之前，必须先避开已有海报的色调、场景、构图和主体，不允许沿用相似路线。",
    ...visuals.map((item, index) => `${index + 1}. ${formatVisualSummary(item)}`),
    "如果你发现新方向与任一已有海报在以下四项里有三项以上接近：色调、场景、构图、主体，必须重新选方向。",
    "同批次的海报要做到同一系列感，但不同书要落在不同的空间、光线、主体与构图里。",
  ].join("\n");
}

export function buildPosterDirectionAnalysisPrompt(input: PosterSpecInput) {
  const profile = inferPosterSceneProfile(input);
  return [
    "你现在处于海报生成前的视觉方向分析阶段。",
    "目标不是生成更复杂的海报，而是先判断这本书应该拥有怎样的独立视觉气质。",
    "请只返回 JSON，不要 Markdown。",
    "JSON 字段必须包含：core_theme, core_emotion, representative_scene, visual_metaphor, recommended_color, recommended_composition, main_subject, banned_visual_tropes.",
    "要求：",
    "1. core_theme 要明确指出这本书最核心的关注点，不能是泛化关键词。",
    "2. core_emotion 要体现整本书的主情绪，最好是可直接用于画面判断的词。",
    "3. representative_scene 必须是一个可被画出来的具体场景，而不是概念。",
    "4. visual_metaphor 要说清楚书如何被转译为画面隐喻。",
    "5. recommended_color 只能给出一套明确色调，不要列过多备选。",
    "6. recommended_composition 必须写出构图倾向和空间关系。",
    "7. main_subject 要明确画面的主体是什么。",
    "8. banned_visual_tropes 至少 5 项，必须包含这本书不该再使用的套路。",
    "9. 如果与已有海报在色调、场景、构图、主体上高度重复，必须重新生成方向，不要沿用旧方案。",
    `书籍信息：书名《${input.title}》；作者：${input.author || "未知"}；主题关键词：${input.themes?.slice(0, 5).join("、") || "从书籍简介中判断"}。`,
    `参考基线：核心主题=${inferPosterVisualDirection(input).core_theme}；核心情绪=${profile.atmosphere}；代表场景=${profile.scene}；视觉隐喻=${profile.fingerprint.visual_symbol}；推荐色彩=${profile.color}；推荐构图=${profile.composition}；主体=${profile.fingerprint.subject_type}。`,
    buildPosterDirectionDedupePrompt(input),
  ].join("\n");
}

export function buildPosterDedupePrompt(input: PosterSpecInput) {
  const visuals = input.existingVisuals?.slice(0, 12) || [];
  if (!visuals.length) {
    return [
      "同批次去重：当前没有可参考的旧海报，但仍要避免默认套路和模板化构图。",
      "默认高级感禁用：黑色背景、暖黄色台灯、木桌、手稿、旧纸张、窗边人物、复古书房、棕黑综合色；如果三个以上元素同时出现，视作模板化风险。",
    ].join(" ");
  }
  return [
    "同批次去重：必须主动避开以下已有海报的场景、主体、色彩、光线和构图，不允许只替换书名。",
    ...visuals.map((item, index) => `${index + 1}. ${formatVisualSummary(item)}`),
    "如果新方案与以上任何一张在场景、主体、光线、色彩、气候或构图上接近，必须重新选择视觉路线。",
    "同批次不同海报至少在以下 5 项上不同：明暗等级、主色、空间类型、构图模式、主体类型、光线策略、材质语言、情绪基调。",
  ].join("\n");
}

export function buildPosterAnalysisPrompt(input: PosterSpecInput) {
  const profile = inferPosterSceneProfile(input);
  return [
    "生成前分析：",
    `书籍类型：${profile.fingerprint.book_type}`,
    `核心场景：${profile.scene}`,
    `核心问题：这本书真正应该被看到的，是${profile.fingerprint.visual_symbol}背后的${profile.atmosphere}。`,
    `视觉气候：${profile.fingerprint.visual_climate}`,
    `色彩人格：${profile.fingerprint.color_persona}`,
    `构图模式：${profile.fingerprint.composition_mode}`,
    `风格指纹：\n${buildPosterFingerprintYaml(input)}`,
  ].join("\n");
}

export function buildPosterSpecPrompt(input: PosterSpecInput) {
  const profile = inferPosterSceneProfile(input);
  return [
    "角色：你是一名高级出版社视觉设计师，擅长文学出版物、博物馆展览海报和杂志专题封面。",
    "项目目标：生成高级阅读海报，不是App信息卡片、PPT页面、营销Banner或社交媒体模板图。判断顺序是：先像这本书，再像这个系列。",
    `书籍信息：书名《${input.title}》；作者：${input.author || "未知"}；类型：${profile.fingerprint.book_type}；主题：${input.themes?.slice(0, 5).join("、") || "从书籍简介中判断"}。`,
    buildPosterAnalysisPrompt(input),
    "统一层：统一画幅比例、信息结构、排版质量、品牌识别和输出标准。",
    "变化层：改变色彩、明暗、场景、光线、材质、构图、情绪和叙事方式，避免一切书都套同一种暗色电影风。",
    "固定版式：顶部系列标识、主标题、副标题、简短阅读价值、关键词、作者信息。版式依靠留白、字体、比例、对齐和空间关系建立，不使用容器。",
    `场景四要素：时间/光线=${profile.lighting}；空间=${profile.fingerprint.space_type}；情绪=${profile.atmosphere}；叙事=${profile.scene}`,
    `视觉气候：${profile.fingerprint.visual_climate}`,
    `色彩人格：${profile.fingerprint.color_persona}`,
    `构图模式：${profile.fingerprint.composition_mode}`,
    `主体：${profile.fingerprint.subject_type}`,
    `材质：${profile.material}`,
    `色彩：${profile.color}`,
    `排版：${profile.typography}`,
    `构图：${profile.composition}`,
    "类型隔离：历史类禁止未来科技感；商业类禁止旧纸张和复古桌面；文学类禁止商业图表感；科普类禁止历史档案感。",
    "默认高级感禁用：黑色背景、暖黄色台灯、木桌、手稿、旧纸张、窗边人物、复古书房、棕黑综合色；若没有强相关内容，三项以上同时出现视作模板化风险。",
    buildPosterDedupePrompt(input),
    "质量验收：内容匹配30分、独特性30分、艺术性20分、信息设计20分；如果预计低于80分，必须在输出前自行重设方案。",
    "禁止：大面积文字底板、半透明蒙层、玻璃拟态、圆角卡片、UI容器、标签按钮、单一静物、千篇一律复古书房、只替换标题作者和背景。",
  ].join("\n");
}

export function buildPosterImagePrompt(input: PosterSpecInput) {
  const profile = inferPosterSceneProfile(input);
  const direction = input.direction || inferPosterVisualDirection(input);
  return [
    "你是一名高级出版社视觉设计师，正在为一个阅读海报系列生成最终成图。",
    `请为《${input.title}》生成一张竖版阅读海报，画幅比例 2:3，质感接近高级图书封面、文学出版视觉、博物馆展览海报或杂志专题封面。`,
    "核心原则：先像这本书，再像这个系列。不要做信息卡片，不要做PPT，不要做营销图。",
    buildPosterSpecPrompt(input),
    "视觉方向分析结果：",
    `- 核心主题：${direction.core_theme}`,
    `- 核心情绪：${direction.core_emotion}`,
    `- 代表场景：${direction.representative_scene}`,
    `- 视觉隐喻：${direction.visual_metaphor}`,
    `- 推荐色彩：${direction.recommended_color}`,
    `- 推荐构图：${direction.recommended_composition}`,
    `- 主体：${direction.main_subject}`,
    `- 禁止套路：${direction.banned_visual_tropes.join("、")}`,
    "最终成图要求：",
    `1. 必须表现这幕画面：${direction.representative_scene}`,
    `2. 必须有前景、中景、背景三层空间关系：${direction.recommended_composition}`,
    `3. 必须有明确光源和空气感：${profile.lighting}`,
    `4. 必须有真实材质和时间痕迹：${profile.material}`,
    `5. 必须服从视觉气候：${profile.fingerprint.visual_climate}；色彩人格：${profile.fingerprint.color_persona}；构图模式：${profile.fingerprint.composition_mode}`,
    "6. 标题、作者、副标题、关键词可作为出版排版自然融入画面；文字必须可读、克制、与画面统一，不要像后期UI覆盖层。",
    "7. 主体必须明确，但要和环境发生关系，不能单独摆在纯背景上。",
    "8. 避免同批次重复，尤其避免所有历史书都变成书房木桌、所有文学书都变成窗边暖光。",
    `负向约束：${buildPosterNegativePrompt(input)}`,
  ].join("\n");
}
