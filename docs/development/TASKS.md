# 开发任务

## 执行规则
- 每个 Phase 必须由开发者完成实现、Type Check、Lint、Build，并使用 Google Chrome 自主进行实际功能验证。
- 只有浏览器验证通过后，才允许进入下一 Phase；发现问题必须先修复并重新验证。
- 全部 Phase 0—9 完成并通过验证后，才提交最终结果。

## Phase 0：工程初始化
- [x] Next.js + TypeScript 基础工程
- [x] 响应式基础 Layout 与 Liquid Glass Token
- [x] PWA Manifest
- [x] 环境变量模板
- [x] README / PRD / 决策记录
- [x] Type Check / Lint / Build 验收（`npx tsc --noEmit`、`npx next build`）

## Phase 1—9
- [x] Phase 1：数据库与迁移（schema migration、外键、索引、TS 类型）
- [x] Phase 2：基础书库（本地会话模型、联网候选、手动创建与 Supabase CRUD）
- [x] Phase 3：阅读进度（页码、章节、完成、暂停、重读与 Progress Log）
- [x] Phase 4：书籍联网信息（Provider、搜索候选确认、手动回退）
- [x] Phase 5：统计（累计/年度/月度/在读、半年趋势、主题展示）
- [x] Phase 6：AI 文字能力（Provider、兜底、生成/编辑/保存笔记、主题生成）
- [x] Phase 7：AI 海报（确定性 3:4 SVG 合成、预览与下载）
- [x] Phase 8：Liquid Glass UI Polish（基础视觉与暗色模式）
- [x] Phase 9：QA（自动化测试、Type Check、Lint、Build、Chrome 回归）
