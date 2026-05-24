# Health Agent Image Chat Design

## Goal

将 `health_sys` 中原本独立的“拍照识别”卡片改为 Agent 对话入口。用户点击入口后，在右侧 Agent 抽屉中上传餐食图片，并通过现有 Coze BFF 发起真实多模态对话，返回热量与营养估算结果。

## Confirmed Decisions

- 保留当前首页总览布局，不改成独立聊天页。
- `拍照识别` 卡片不再直接执行识别，只负责打开 Agent 对话抽屉。
- 桌面端使用右侧抽屉承载 Agent 对话；移动端使用全屏覆盖层承载同一能力。
- 继续复用仓库根目录现有 Node.js BFF，不新增第二个后端服务。
- 图片识别走 Coze 官方支持的“对话中使用文件（图片）”能力，不做前端 mock，不做静默降级。
- 旧的文本接口继续保留，新的图片识别能力使用独立接口，避免破坏现有页面与调试路径。

## Product Behavior

首页上的 `实物拍照计算热量` 卡片继续存在，但文案和操作语义改成“进入 Agent 后上传图片识别”。点击按钮后，打开右侧抽屉并自动聚焦到上传区域。

在抽屉里，用户可以：

- 选择一张本地图片；
- 可选输入补充说明，例如“这是我的午饭，请估算热量和三大营养素”；
- 发送给 Agent；
- 查看真实返回的识别结果与失败信息。

`AI 助手` 入口与 `拍照识别` 卡片共享同一个抽屉与会话状态。两者只是不同入口，不再形成两套 Agent 体验。

## Frontend Architecture

当前 [App.tsx](/Users/xiaoyuanshen/Desktop/火山杯/health_sys/src/App.tsx) 已接近文件上限，新增抽屉、上传和会话逻辑后会继续膨胀，因此需要做一次小范围职责拆分。

建议拆分为以下单元：

- `FoodScanCard`
  - 只负责展示“拍照识别入口”信息和打开抽屉。
- `AgentEntry`
  - 继续保留桌面方形入口和移动端底部入口，但点击后统一进入同一个抽屉。
- `AgentDrawer`
  - 负责抽屉容器、关闭动作、会话滚动区、上传区域、预览、输入框、发送按钮和错误展示。
- `useAgentChat`
  - 管理本地状态：`isOpen`、`messages`、`selectedImage`、`inputText`、`isSending`、`error`。
- `agent API client`
  - 封装发往后端的新图片识别接口，避免组件内直接拼接 `fetch`。

不引入全局状态管理，也不引入新的 UI 框架。继续沿用 React 本地状态和现有 CSS 体系。

## Frontend Interaction Details

### Desktop

- 点击 `拍照识别` 卡片按钮，右侧抽屉滑出。
- 抽屉宽度固定在适合图片预览与消息阅读的范围内，不挤压主页面内容到不可读。
- 上传前显示空态引导，说明“上传餐食图片后，Agent 会估算热量与营养素”。
- 上传后显示缩略预览、文件名和移除操作。
- 发送成功后，在消息流中展示：
  - 用户文本；
  - 用户图片卡片；
  - Agent 返回结果。

### Mobile

- 复用同一套会话能力，但展示为全屏覆盖层。
- 保留现有底部 `点击和扣子聊天` 入口语义，点击后进入同一会话层。
- 图片预览、输入和发送区固定在合理顺序内，避免底部输入区覆盖结果。

## API Design

保留现有 `POST /api/chat` 文本接口，新增一个专用于图片识别的新接口：

- `POST /api/chat-with-image`

请求格式：

- `Content-Type: multipart/form-data`
- 字段：
  - `message`: string，可空但建议前端总是传入默认提示
  - `image`: file，必填

成功响应格式：

```json
{
  "answer": "估算总热量约 520 kcal，主要由鸡胸肉、米饭和西兰花组成……",
  "coze": {
    "mode": "sdk",
    "messageCount": 3
  },
  "imageMeta": {
    "name": "lunch.jpg",
    "size": 245812
  }
}
```

失败响应格式：

```json
{
  "error": "Coze 对话执行失败",
  "details": {
    "code": "..."
  }
}
```

前端不根据 HTTP 200 猜测是否成功，必须显式读取 `answer`。

## Backend Architecture

根目录现有 [server.js](/Users/xiaoyuanshen/Desktop/火山杯/server.js) 继续作为唯一 BFF。该文件需要扩展，而不是新建并行服务。

后端职责拆分如下：

- 读取与校验 Coze 配置；
- 使用 `multipart/form-data` 解析中间件处理图片上传，建议采用 `multer` 的内存存储；
- 使用 Coze 官方 Node SDK `@coze/api` 组织“文本 + 图片”的用户消息；
- 等待对话完成并提取最终 `answer`；
- 将明确错误返回前端。

不继续沿用手写 `fetch('https://api.coze.cn/v3/chat')` 处理图片链路。文本链路可暂时保留原有实现，图片链路切到官方 SDK，减少协议细节和文件消息结构的维护成本。

## Coze Integration

Coze 图片识别能力通过官方支持的“对话中使用文件（图片）”能力接入。BFF 侧完成以下流程：

1. 接收前端上传的图片文件。
2. 调用 SDK 的 `client.files.upload({ file })` 上传图片，拿到 Coze `file_id`。
3. 调用 SDK 的 `client.chat.createAndPoll(...)` 发起对话。
4. 用户输入使用一条 `content_type: "object_string"` 的多模态消息，内容固定由两段组成：
   - `{ type: "text", text: "<用户说明或默认提示词>" }`
   - `{ type: "image", file_id: "<uploaded_file_id>" }`
5. 从完成态对话结果中提取最终 `answer` 消息返回前端。

也就是说，图片不是转 base64 塞进文本，也不是先落地到你自己的对象存储后再转 URL，而是走 Coze 官方文件上传与多模态消息链路。

为保证输出稳定，前端发送的默认提示语需要固定为围绕热量识别的意图，例如：

“请根据这张餐食图片估算总热量、主要食物构成以及蛋白质、碳水、脂肪含量，并说明估算的不确定性。”

这样即使 Bot 当前提示词更泛化，也能把本次对话收束到餐食识别场景。

## Error Handling

本改动遵循“失败显式暴露”的规则，不添加静默 fallback。

必须明确报错的场景包括：

- 未上传图片；
- 图片类型不支持；
- 图片超过服务端允许大小；
- Coze Token 或 Bot ID 未配置；
- 图片上传至 Coze 失败；
- Coze 对话失败；
- Coze 返回中缺少最终 `answer`；
- 前端请求中断或网络错误。

前端需要在抽屉中显示用户可读错误信息；后端需要保留结构化 `details`，便于排查。

## Validation Rules

- 前端仅接受常见图片类型，例如 `image/jpeg`、`image/png`、`image/webp`。
- 文件大小限制需要明确为常量，例如 `MAX_IMAGE_SIZE_MB`，避免魔法数字。
- 服务端不修改上传文件内容，不做压缩兜底，不做伪成功回复。
- 抽屉关闭后，会话状态保留在当前页面生命周期内，避免用户重新打开后丢失刚刚的结果。

## Testing

### Frontend

- 点击 `开始识别` 会打开 Agent 抽屉。
- `AI 助手` 入口打开同一个抽屉，而不是不同页面。
- 未选择图片时不能发送，并有明确提示。
- 选择图片后显示预览或文件名。
- 发送过程中按钮进入不可重复点击状态。
- 成功时展示真实返回的 `answer`。
- 失败时展示错误消息。

### Backend

- `POST /api/chat` 旧文本接口保持可用。
- `POST /api/chat-with-image` 缺图时返回 400。
- 环境变量缺失时返回 500，并指出缺失项。
- Coze 返回异常时返回非成功状态和结构化细节。
- 成功时返回 `answer`，且不是空字符串。

### Manual Verification

- 在桌面端首页点击 `拍照识别`，右侧抽屉打开。
- 上传真实餐食图片并发送。
- Coze 返回热量识别结果。
- 移动端入口仍可打开同一会话能力。
- 旧的根目录聊天页不因本次改动而失效。

## Out of Scope

本次不包含以下内容：

- 新增独立图片存储服务；
- 登录、历史会话云同步；
- 图片识别结果结构化数据库入库；
- 多图片批量上传；
- 识别结果卡片化图表重排；
- 替换根目录现有文本聊天页的实现。
