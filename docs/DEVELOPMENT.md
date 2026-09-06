# 开发过程与完善记录

## 证据与周期

现有决策文档最早日期为 2026-08-30，Git 初始化提交为 2026-08-31 00:21（+08:00），后续汇总提交为 2026-09-06 14:25（+08:00），本次整理为 2026-09-06。可确认约一周的记录区间，无法从两个历史提交计算实际开发工时，也无法给每项功能指定准确开发日。

以下阶段按需求演进和当前源码归纳，表示完善方向，不表示每个阶段都曾有独立提交或完整自动化验收。

## 1.0 基础阶段

初始化版本已建立 Next.js 14 / React 18 工程、响应式视觉层、Book 与 ReadingSession 一对多模型、ProgressLog、浏览器档案、统计与 AI 接口基础，以及可选 Supabase 适配。PRD、TASKS、QA 与 DECISIONS 保留历史设计上下文；其中计划项不等于当前全部实现。

## 2.0 完善阶段

| 需求或问题 | 完善内容 | 主要位置 |
| --- | --- | --- |
| 新增书籍、AI 解析与搜索混淆 | 公共书目检索和文本模型分离，客户端统一传递 AI 配置，接口处理异常 | `components/add-book-modal.tsx`、`lib/ai-client.ts`、`app/api/books/` |
| 主题只是词语堆叠 | 加入书架简介、共性、分支和词云视图 | `components/topic-analysis-panel.tsx`、`app/reports/` |
| 报告和统计职责不清 | AI 主题分析放到报告，阶段性阅读报告与最近完成放到统计 | `app/analytics/`、`app/reports/` |
| 海报过度依赖封面、风格重复 | 独立图像 Provider，书籍主题与视觉方向分析、历史风格指纹、Prompt 约束 | `lib/poster-spec.ts`、`lib/providers/ai.ts`、`lib/providers/image.ts` |
| 海报文字与背景重复叠加 | 完善生成图展示、文字排版和保存恢复逻辑 | `app/poster/page.tsx` |
| 图片挤占 Local Storage 配额 | 图片迁移 IndexedDB，结构化档案保留引用，同步时尝试补齐图片 | `lib/archive.ts` |
| 不同浏览器数据不一致 | 启动同步 Provider、云档案合并、图片补齐 | `components/archive-sync-provider.tsx`、`lib/supabase-adapter.ts` |
| 界面入口、日历、弹窗不统一 | 底部导航、状态色、阅读日历展开与页面布局完善 | `components/bottom-nav.tsx`、`app/globals.css`、`app/analytics/` |
| 本地改动在部署回退中混淆 | 保留包含本地完善的汇总提交，选择性移除部署配置与依赖 | 本次 Git 差异 |
| 启动时报缺少编译模块 | 停止旧 Next.js 服务，开发缓存独立到 `.next-dev` | `next.config.mjs` |

海报需求曾多次更新；仓库现有独立规范文档是 `docs/AI阅读海报生成模板规范文档_V1.0.md`，执行约束以当前 `lib/poster-spec.ts` 为准，不声称后续每份外部规范原件均已归档。

## 本次发布整理

- 应用版本标记为 2.0.0，建立 1.0/2.0 独立分支与标签；1.0 源码原样保留。
- 补充 README、更新日志、版本管理和书架备份说明。
- 将所有者要求上传的本地书架 JSON 纳入跟踪，环境密钥、运行日志和构建缓存继续忽略。
- 移除过期 npm 锁文件，保留 pnpm 锁文件；Next.js 15 使用 ESLint CLI 检查，QA 对非零退出码停止。

## 已知边界

文本和图像调用受网络、额度和模型权限影响，失败兜底不等于真实模型输出。海报差异约束不等于对生成图片进行视觉质量证明。当前文件快照没有 UI 导入入口，本地同步接口未配置 Supabase 时不会写磁盘 JSON；跨浏览器共享不能仅靠同一源码实现。Service Worker 尚无完整离线预缓存策略。
