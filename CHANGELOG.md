# Changelog

## Unreleased
- 初始化 Reading Archive PWA 基础工程与 Liquid Glass 视觉层。
- 建立书籍、阅读会话、进度日志及 AI 相关数据模型。
- 增加本地书架、进度操作、统计、报告、设置、海报和 AI Provider 兜底接口。
- 增加 Chrome 回归检查与隔离开发/构建缓存目录。
- 会话化重构：同一本书支持多次 Reading Session，旧版 localStorage 自动迁移。
- 添加书籍支持联网候选、手动创建、阅读来源和日期；详情页支持页码/章节与 Progress Log。
- 增加统计趋势、阶段性报告、AI 笔记编辑保存、AI 主题标准化持久化和 3:4 海报渲染。
- 增加可选 Supabase REST 同步适配器与 `/api/sync`，未配置时安全回退本地模式。
