# 核心库

`lib/` 保存不直接负责页面渲染的领域逻辑：`archive.ts` 是档案模型和持久化，`providers/` 是外部服务适配器，`poster-spec.ts` 是海报生成约束，`database.types.ts` 是数据类型。新增服务适配器放入 `providers/`，不要在页面中直接拼接外部 API。
