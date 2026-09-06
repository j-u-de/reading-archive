# Reading Archive 2.0

Reading Archive 是一个面向个人长期阅读的响应式 Web App。它把书架、阅读过程、进度记录、统计分析、AI 阅读辅助和阅读海报放在同一套数据模型中。本地阅读记录不依赖 AI 或云端服务；搜索、AI 和云同步需要网络。本项目包含 PWA manifest 和 Service Worker 基础设施，但目前不保证完整离线启动。

产品需求基准见 [PRD.md](./docs/project/PRD.md)，变更时间线见 [CHANGELOG.md](./docs/development/CHANGELOG.md)，关键技术取舍见 [DECISIONS.md](./docs/development/DECISIONS.md)。本版本是同一仓库中的 2.0 版本，延续 1.0 的数据模型并补充完整的阅读工作流与视觉体验。

## 版本入口

| 版本 | 独立分支 | 固定版本标签 | 内容 |
| --- | --- | --- | --- |
| 1.0 | [codex/v1.0](https://github.com/j-u-de/reading-archive/tree/codex/v1.0) | [v1.0.0](https://github.com/j-u-de/reading-archive/tree/v1.0.0) | 原始初始化提交 `9976b22`，保持原样 |
| 2.0 | [codex/v2.0](https://github.com/j-u-de/reading-archive/tree/codex/v2.0) | [v2.0.0](https://github.com/j-u-de/reading-archive/tree/v2.0.0) | 当前本地完善版本、说明文档和经项目所有者授权上传的书架档案 |
| 最新 | [main](https://github.com/j-u-de/reading-archive) | 随后续开发推进 | 本次与 2.0 发布内容一致 |

每个分支都包含完整项目。通过 GitHub 分支选择器切换版本，或进入标签页面下载对应版本 ZIP。版本规则与独立下载方式见 [版本管理说明](./docs/project/VERSIONS.md)。

## 可以实现什么

- 书架管理：通过公开书目服务搜索候选书，也可以手动添加书籍，维护作者、简介、封面、标签、阅读状态和来源。
- 阅读记录：维护想读、在读、已读、暂停状态，支持页码或章节进度；同一本书可以建立多次阅读会话，并保留历史日志。
- 书籍详情：查看阅读进度、进度日志、阅读笔记和 AI 解析结果。
- 统计与报告：查看年度阅读数量、状态分布、趋势、阶段性阅读报告和最近完成的书籍。
- AI 阅读辅助：通过配置的 AI Provider 生成书籍解析、摘要、主题和阅读建议；调用失败时保留本地记录，不阻塞书架使用。
- 主题分析：对书架内容进行主题词云、书架简介、共性分析和分支分析，帮助识别个人阅读结构。
- 阅读海报：选择书籍并生成 3:4 阅读海报，海报数据自动保存，之后再次选中同一本书时可以恢复上次结果。
- 数据管理：默认使用浏览器本地 `reading-archive-v2` 档案，支持 JSON / CSV 导出；封面和海报大图使用 IndexedDB 存储。
- 可选同步：配置 Supabase 后，通过 `/api/sync` 同步书籍和阅读会话；本地模式仍可独立运行。
- 响应式界面：适配桌面和移动尺寸，底部导航覆盖书架、统计、海报、报告和设置等核心入口。

## 技术栈

- Next.js 15 App Router、React 19、TypeScript
- CSS Design Tokens 与响应式布局
- 浏览器 Local Storage 保存结构化档案，IndexedDB 保存封面和海报大图
- 可选 Supabase REST 同步适配器
- Open Library / Google Books 公共书目接口
- Python 标准库联网搜索代理（可选）
- Node test runner、TypeScript 和 Next.js build 作为校验工具

## 开发周期与版本边界

技术决策文档最早记录于 2026-08-30，首个 Git 提交为 2026-08-31，2.0 整理日期为 2026-09-06，记录覆盖约一周。这是可追溯的日历区间，不是精确工时。1.0 已包含基础书架、阅读会话、统计、AI 和同步适配；2.0 在此基础上深化海报、主题分析、图片存储和 UI，并升级运行依赖。详见 [开发过程记录](./docs/development/DEVELOPMENT.md)；没有逐日证据的改动按阶段记录。

2.0 保留已有 1.0 的书籍与阅读会话概念，不改变本地档案的核心结构。部署实验相关配置已从项目剥离，当前仓库聚焦本地应用开发和可移植的应用源码；部署平台配置不属于本版本的应用运行依赖。

## 本地开发

需要 Node.js 22.18 或更高版本，以及 `package.json` 指定的 pnpm 版本（11.19.0）。仓库统一使用 `pnpm-lock.yaml`，不再维护旧版 npm 锁文件。初次安装 pnpm 可运行 `npm install -g pnpm@11.19.0`。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 `http://localhost:3000`。开发时如果缓存异常，使用：

```bash
pnpm dev:clean
```

开发服务器使用 `.next-dev`，生产构建使用 `.next`，两者互不覆盖。执行 `dev:clean` 前先停止开发服务；该命令需要 Windows PowerShell。删除构建缓存不会删除浏览器书架或仓库中的数据档案。正式本地构建可运行 `pnpm build` 后执行 `pnpm start`。

### AI 配置

在 `/settings/ai` 分别填写文本模型和图像模型的地址、模型名称、密钥，也可参考 `.env.example` 在本机 `.env.local` 配置。模型名称应以服务商账户实际可用模型为准。文本 API Key 不能替代生图模型的授权。

- 文本：`AI_PROVIDER`、`AI_BASE_URL`、`AI_MODEL`、`AI_API_KEY`。
- 图像：`IMAGE_AI_BASE_URL`、`IMAGE_AI_MODEL`、`IMAGE_AI_API_KEY`。
- 千问示例：图像地址为 `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation`，模型可填账户开通的 `qwen-image-3.0-pro`，密钥填 DashScope Key。

通用 `IMAGE_AI_*` 配置优先于 `IMAGE_AI_DASHSCOPE_*` 别名。使用千问时直接设置通用三项，避免同时保留 OpenAI 默认地址。密钥不包含在 Git 仓库中，需要在新机器单独配置。AI 的可用性仍受余额、限流、服务商状态和网络影响。

## 校验

```bash
pnpm lint
pnpm test
pnpm build
pnpm typecheck
```

完整 QA：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

## 可选联网搜索服务

项目附带无第三方依赖的 Python 服务 `reading_archive_api.py`，调用 Open Library 公共接口：

```bash
python reading_archive_api.py
```

启动后访问 `http://127.0.0.1:8787/search?q=百年孤独`。前端默认直接使用 Open Library，并在不可用时回退到 Google Books；也可以通过 `PYTHON_PROXY_URL` 接入 Python 服务或已有代理。联网搜索只负责获取公开书目信息，AI 功能使用独立的 Provider 配置。

## 数据与同步

默认模式是浏览器本地 `reading-archive-v2` 档案。配置 `NEXT_PUBLIC_SUPABASE_URL` 和服务端 `SUPABASE_SERVICE_ROLE_KEY` 后，可通过 `POST /api/sync` 同步 Book 与 ReadingSession；未配置或同步失败时接口返回 `local` 模式，不阻塞本地阅读流程。

数据库表定义位于 `supabase/`。图片随档案同步时会尝试补齐 IndexedDB 中的内容。浏览器数据按浏览器配置与网址（包含端口）隔离，换浏览器不会自动共享 Local Storage。

按项目所有者要求，本版本提交 `data/reading-archive-sync.json`，包含 53 本书、55 次阅读、1 条进度日志、1 条笔记、70 条主题记录和 3 张海报。32 张封面及 3 张海报包含图片数据，20 张封面保留网络链接，1 本书没有封面。详见 [书架档案说明](./data/README.md)。这是已有本地文件的版本快照，不代表浏览器后续修改会自动写进 Git。

当前 `/api/sync` 只对接 Supabase，不读取该 JSON 文件；设置页有导出与云同步按钮，没有文件导入入口。此档案作为备份保留，不能通过把整份含图片 JSON 塞入 Local Storage 的方式恢复，以免超出配额。设置页 JSON 导出也可能仅含 IndexedDB 图片引用，不能视为完整图片备份。

首次使用云端登录时，在 Supabase 控制台 Authentication → Users → Add user 创建 Owner 用户，然后访问 `/login` 登录。令牌只保存在当前浏览器中；`service_role` 密钥只能放在服务端环境变量。

## 项目目录

| 目录 | 作用 |
| --- | --- |
| `app/` | 页面、布局和 Next.js API 路由 |
| `components/` | 可复用 UI 与阅读交互组件 |
| `lib/` | 数据模型、本地存储、AI、同步和书目适配器 |
| `data/` | 经授权纳入 2.0 的书架快照及说明，其余临时数据仍忽略 |
| `scripts/` | QA、AI 检查和本地服务脚本 |
| `tests/` | 数据迁移和核心逻辑测试 |
| `public/` | 静态资源 |

更细的目录职责见各代码目录下的 `README.md`，约束规范集中在 `docs/constraints/`，开发记录集中在 `docs/development/`，产品和版本资料集中在 `docs/project/`。
