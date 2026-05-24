# Health Agent Image Chat Implementation Plan

**Goal:** 将 `health_sys` 的“拍照识别”改为 Agent 对话入口，并通过根目录现有 Coze BFF 支持真实图片上传识别热量。

**Architecture:** 前端继续使用 Vite + React + TypeScript，本地状态管理 Agent 抽屉与上传流程；后端继续复用根目录 `server.js`，新增 `multipart/form-data` 图片聊天接口，并通过 `@coze/api` 官方 SDK 完成文件上传和多模态对话。

**Tech Stack:** React, TypeScript, CSS, Vitest, Express, multer, @coze/api.

---

## File Structure

- Modify: `health_sys/src/App.tsx`
- Create: `health_sys/src/components/AgentDrawer.tsx`
- Create: `health_sys/src/api/agent.ts`
- Create: `health_sys/src/hooks/useAgentChat.ts`
- Modify: `health_sys/src/App.test.tsx`
- Modify: `health_sys/src/styles.css`
- Modify: `package.json`
- Modify: `server.js`

## Tasks

### Task 1: Refactor Frontend Entry Points

**Files:**
- Modify: `health_sys/src/App.tsx`
- Create: `health_sys/src/components/AgentDrawer.tsx`
- Create: `health_sys/src/hooks/useAgentChat.ts`

- [ ] **Step 1: Split Agent UI responsibilities**

Extract shared Agent drawer state and presentation so `拍照识别` and `AI 助手` open the same chat surface.

- [ ] **Step 2: Convert photo scan card to an Agent entry**

Update the card copy and button behavior so it opens the Agent drawer instead of implying in-card recognition.

- [ ] **Step 3: Add drawer and mobile overlay behavior**

Implement desktop right drawer and mobile full-screen overlay, including open, close, focus, upload, preview, remove, input, send, loading, and error states.

### Task 2: Add Frontend API And Tests

**Files:**
- Create: `health_sys/src/api/agent.ts`
- Modify: `health_sys/src/App.test.tsx`

- [ ] **Step 1: Add API client for image chat**

Create a dedicated client that sends `multipart/form-data` to `/api/chat-with-image` and throws on missing `answer` or non-OK responses.

- [ ] **Step 2: Expand UI tests**

Cover opening the drawer, shared Agent entry behavior, blocked send without image, and successful rendering of returned answers.

### Task 3: Extend Coze BFF For Image Chat

**Files:**
- Modify: `package.json`
- Modify: `server.js`

- [ ] **Step 1: Add backend dependencies**

Install `multer` for upload parsing and `@coze/api` for official Coze file and chat operations.

- [ ] **Step 2: Keep text endpoint intact**

Preserve existing `/api/chat` behavior so the root demo page does not regress.

- [ ] **Step 3: Add `/api/chat-with-image`**

Parse uploaded files in memory, validate file type and size, upload to Coze with `client.files.upload`, send a multimodal user message with `client.chat.createAndPoll`, and return the final `answer`.

- [ ] **Step 4: Expose explicit failures**

Return clear 4xx/5xx responses for invalid input, missing config, upload failures, chat failures, and empty answers.

### Task 4: Verify End To End

**Files:**
- No new files.

- [ ] **Step 1: Run frontend tests**

Run `npm test` inside `health_sys` and fix any failures.

- [ ] **Step 2: Run frontend build**

Run `npm run build` inside `health_sys`.

- [ ] **Step 3: Run backend smoke checks**

Start the BFF and verify:
- `/api/chat` still accepts text;
- `/api/chat-with-image` rejects missing files;
- environment/config errors remain explicit.

- [ ] **Step 4: Manual UI verification**

Open the app locally and verify:
- `拍照识别` opens the Agent drawer;
- uploaded image preview appears before send;
- Agent answer renders after response;
- mobile entry opens the same conversation surface.
