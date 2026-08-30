# Reading Archive

个人读书记录 App（Responsive Web App / PWA）。产品需求基准见 [PRD.md](./PRD.md)。

## 开发

```bash
npm install
npm run dev
```

## 校验

```bash
npm run typecheck
npm run build
```

完整 QA（按顺序执行，避免开发服务器与构建互相占用缓存）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/qa.ps1
```

本地预览请使用 Google Chrome 打开 `http://localhost:3000`。开发时使用 `npm run dev:clean`，构建和开发缓存互相隔离。

## Python 联网搜索服务

项目附带无第三方依赖的 Python 服务 `reading_archive_api.py`，直接调用 Open Library 公共接口：

```bash
python reading_archive_api.py
```

启动后可访问 `http://127.0.0.1:8787/search?q=百年孤独`。前端 Next.js API 默认直接使用 Open Library，并在不可用时回退到 Google Books（可通过 `PYTHON_PROXY_URL` 接入上述 Python 服务或已有代理）。

## 数据模式

默认使用浏览器本地 `reading-archive-v2` 档案，支持离线记录与 JSON/CSV 导出。配置 `NEXT_PUBLIC_SUPABASE_URL` 和服务端 `SUPABASE_SERVICE_ROLE_KEY` 后，可通过 `POST /api/sync` 同步 Book 与 ReadingSession；未配置或同步失败时接口明确返回 `local` 模式，不会阻塞本地阅读流程。

首次使用云端登录时，在 Supabase 控制台 Authentication → Users → Add user 创建 Owner 用户，然后访问 `/login` 登录。令牌只保存在当前浏览器中；`service_role` 密钥只能放在服务端环境变量。
