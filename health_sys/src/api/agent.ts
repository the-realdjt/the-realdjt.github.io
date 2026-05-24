export const DEFAULT_IMAGE_PROMPT =
  "请根据这张餐食图片估算总热量、主要食物构成以及蛋白质、碳水、脂肪含量，并说明估算的不确定性。";

const IMAGE_CHAT_URL = "/api/chat-with-image";
const TEXT_CHAT_URL = "/api/chat";

export type AgentChatResponse = {
  answer: string;
  coze?: {
    mode?: string;
    messageCount?: number;
    status?: string;
  };
  imageMeta?: {
    name?: string;
    size?: number;
    fileId?: string;
  };
};

type SendAgentImageChatOptions = {
  image: File;
  message?: string;
};

type SendAgentTextChatOptions = {
  message: string;
};

export async function sendAgentTextChat(options: SendAgentTextChatOptions): Promise<AgentChatResponse> {
  const response = await fetch(TEXT_CHAT_URL, {
    body: JSON.stringify({ message: options.message.trim() }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(formatServerError(response.status, data));
  }
  if (!isAgentChatResponse(data)) {
    throw new Error("后端响应中缺少 answer 字段");
  }

  return data;
}

export async function sendAgentImageChat(options: SendAgentImageChatOptions): Promise<AgentChatResponse> {
  const formData = new FormData();
  formData.set("message", options.message?.trim() || DEFAULT_IMAGE_PROMPT);
  formData.set("image", options.image);

  const response = await fetch(IMAGE_CHAT_URL, {
    method: "POST",
    body: formData
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(formatServerError(response.status, data));
  }
  if (!isAgentChatResponse(data)) {
    throw new Error("后端响应中缺少 answer 字段");
  }

  return data;
}

async function readJson(response: Response): Promise<AgentChatResponse | ServerErrorResponse | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type ServerErrorResponse = {
  error?: string;
  details?: {
    code?: string | number;
    missing?: string[];
    cozeStatus?: number;
    limitMb?: number;
  };
};

function formatServerError(status: number, data: ServerErrorResponse | AgentChatResponse | null): string {
  const detail = readErrorDetail(data);
  const error = isServerErrorResponse(data) ? data.error || "未知错误" : "未知错误";
  return `请求失败 ${status}: ${error}${detail ? ` (${detail})` : ""}`;
}

function readErrorDetail(data: ServerErrorResponse | AgentChatResponse | null): string {
  if (!isServerErrorResponse(data) || !data.details) {
    return "";
  }
  if (data.details.missing?.length) {
    return data.details.missing.join(", ");
  }
  if (typeof data.details.limitMb === "number") {
    return `限制 ${data.details.limitMb} MB`;
  }
  if (data.details.code) {
    return `code ${data.details.code}`;
  }
  if (data.details.cozeStatus) {
    return `Coze ${data.details.cozeStatus}`;
  }
  return "";
}

function isServerErrorResponse(data: ServerErrorResponse | AgentChatResponse | null): data is ServerErrorResponse {
  return Boolean(data && typeof data === "object" && "error" in data);
}

function isAgentChatResponse(data: ServerErrorResponse | AgentChatResponse | null): data is AgentChatResponse {
  return Boolean(data && typeof data === "object" && "answer" in data && typeof data.answer === "string");
}
