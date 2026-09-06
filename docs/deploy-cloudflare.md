# Cloudflare 部署

这个项目的部署目标是拿到一个可直接打开、可分享的线上网址。

## 依赖

- Cloudflare 账号
- 一个 R2 bucket，用于 OpenNext 缓存
- Supabase 项目，用于共享书架数据
- 你的 AI 密钥

## 必配环境

### Supabase

公开访问的书架需要云端数据层。请配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`NEXT_PUBLIC_*` 变量要在构建前就存在，因为它们会被写入前端包。

### AI

按你当前启用的模型配置：

- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`
- `IMAGE_AI_API_KEY`
- `IMAGE_AI_BASE_URL`
- `IMAGE_AI_MODEL`
- `IMAGE_AI_DASHSCOPE_API_KEY`
- `IMAGE_AI_DASHSCOPE_BASE_URL`
- `IMAGE_AI_DASHSCOPE_MODEL`

### 可选

- `PYTHON_PROXY_URL`
- `WEB_SEARCH_API_KEY`

## 部署步骤

1. 在 Cloudflare 创建 R2 bucket，命名建议为 `reading-archive-opennext-cache`。
2. 在 Cloudflare 或本地 `.env` / `.dev.vars` 中配置上面的变量。
3. 本地构建：

```bash
pnpm run build:cloudflare
```

4. 本地预览：

```bash
pnpm run preview:cloudflare
```

5. 正式部署：

```bash
pnpm run deploy:cloudflare
```

6. 部署完成后，记录 Cloudflare 返回的 Worker URL，这就是可分享的网址。

## 推荐的线上构建方式

这套仓库已经加了 GitHub Actions 工作流：

- `.github/workflows/deploy-cloudflare.yml`

它会在 `main` 分支 push 后自动在 Linux runner 上执行 `pnpm run deploy:cloudflare`，避免本机 Windows 上 OpenNext 的路径兼容问题。

你需要在 GitHub 仓库的 `Settings -> Secrets and variables -> Actions` 里配置这些密钥：

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_MODEL`
- `AI_API_KEY`
- `TEXT_AI_API_KEY`
- `IMAGE_AI_BASE_URL`
- `IMAGE_AI_MODEL`
- `IMAGE_AI_API_KEY`
- `IMAGE_AI_DASHSCOPE_BASE_URL`
- `IMAGE_AI_DASHSCOPE_MODEL`
- `IMAGE_AI_DASHSCOPE_API_KEY`
- `WEB_SEARCH_API_KEY`
- `PYTHON_PROXY_URL`

## 注意

- 不配置 Supabase 时，项目仍可运行，但数据只保留在当前浏览器，不能作为可共享站点。
- `.open-next` 目录是构建产物，不要提交。
- 如果后续改了 AI 或 Supabase 密钥，只需要更新环境变量，不需要改业务代码。
