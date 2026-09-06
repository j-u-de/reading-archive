# 版本管理

本仓库使用独立分支保存完整版本，用不可移动的发布标签固定下载内容。应用目录不复制成两份，避免依赖安装、构建和数据路径混淆。

| 入口 | 基准 | 维护方式 |
| --- | --- | --- |
| `codex/v1.0`、`v1.0.0` | `9976b22` 初始化提交 | 保存原始源码，不附加 2.0 文档和私人书架 |
| `codex/v2.0`、`v2.0.0` | 当前本地项目整理后的发布提交 | 完整源码、文档、授权书架快照 |
| `main` | 本次推进至 2.0 | 继续后续开发 |

`v1.0.0` 和 `v2.0.0` 是本次补建的发布标记，不表示当时已存在这些标签。后续修复应发布新标签，例如 `v2.0.1`，不移动已发布标签。`dad66e8` 仍保留在历史中，不改写历史、不强制推送。

## 分别下载

通过 GitHub 的分支选择器选择版本后，使用 Code → Download ZIP。也可独立克隆到不同目录：

```bash
git clone --branch v1.0.0 --single-branch https://github.com/j-u-de/reading-archive.git reading-archive-1.0
git clone --branch v2.0.0 --single-branch https://github.com/j-u-de/reading-archive.git reading-archive-2.0
```

按标签克隆会处于 detached HEAD，适合查看固定版本；开发时从该标签创建新分支即可。每个目录使用自己的依赖和该版本的安装说明。两个版本不要同时占用 3000 端口。

## 数据与版本的关系

Git 保存源码和显式提交的文件，不会自动收集 Local Storage、IndexedDB 或 `.env.local`。1.0 不附带本次书架快照；2.0 的快照见 `data/README.md`。切换 Git 版本不会清理浏览器，但旧版代码未必理解新版图片引用，因此查看历史版本时建议使用独立浏览器配置或不同端口。

本次版本同步只向 GitHub 上传仓库，不触发或恢复 Cloudflare、Vercel 部署流程。
