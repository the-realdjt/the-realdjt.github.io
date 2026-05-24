import { ChatEventType, COZE_CN_BASE_URL, CozeAPI, RoleType } from '@coze/api';
import { Readable } from 'stream';
import { PublicError } from './errors.js';

const COZE_CHAT_URL = 'https://api.coze.cn/v3/chat';
const COMPETITION_USER_ID = 'competition_user_prod';
const DEFAULT_IMAGE_PROMPT = '请根据这张餐食图片估算总热量、主要食物构成以及蛋白质、碳水、脂肪含量，并说明估算的不确定性。';

export function readCozeConfig(env) {
  const missing = ['COZE_API_TOKEN', 'COZE_BOT_ID'].filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new PublicError(500, '服务器环境变量未配置完整', { missing });
  }

  return {
    apiToken: env.COZE_API_TOKEN,
    botId: env.COZE_BOT_ID
  };
}

export async function requestCozeTextAnswer(options) {
  const response = await fetch(COZE_CHAT_URL, {
    method: 'POST',
    headers: buildCozeHeaders(options.config.apiToken),
    body: JSON.stringify(buildTextPayload(options))
  });
  const rawText = await response.text();

  if (!response.ok) {
    throw new PublicError(response.status, 'Coze 接口返回非成功状态', {
      body: rawText,
      cozeStatus: response.status
    });
  }

  return buildTextChatResult(rawText);
}

export async function requestCozeImageAnswer(options) {
  const client = createCozeClient(options.config.apiToken);
  const uploadedFile = await uploadImageFile({ client, imageFile: options.imageFile });
  const stream = await client.chat.stream({
    additional_messages: [buildImageMessage({ fileId: uploadedFile.id, message: options.message })],
    auto_save_history: false,
    bot_id: options.config.botId,
    user_id: COMPETITION_USER_ID
  });
  const result = await collectImageAnswer(stream);

  return buildImageChatResult({
    answer: result.answer,
    eventCount: result.eventCount,
    imageFile: options.imageFile,
    uploadedFile
  });
}

function createCozeClient(apiToken) {
  return new CozeAPI({
    baseURL: COZE_CN_BASE_URL,
    token: apiToken
  });
}

function buildTextPayload(options) {
  return {
    additional_messages: [
      {
        content: options.message,
        content_type: 'text',
        role: 'user'
      }
    ],
    auto_save_history: false,
    bot_id: options.config.botId,
    stream: true,
    user_id: COMPETITION_USER_ID
  };
}

function buildCozeHeaders(apiToken) {
  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };
}

function buildTextChatResult(rawText) {
  const parsed = parseCozeResponse(rawText);
  if (!parsed.answer) {
    throw new PublicError(502, 'Coze 返回中未找到 answer 消息', parsed.debug);
  }

  return {
    answer: parsed.answer,
    coze: {
      eventCount: parsed.eventCount,
      mode: parsed.mode
    }
  };
}

function parseCozeResponse(rawText) {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{')) {
    return extractAnswerFromJson(JSON.parse(trimmed));
  }

  return extractAnswerFromSse(trimmed);
}

function extractAnswerFromJson(payload) {
  if (typeof payload?.code === 'number' && payload.code !== 0) {
    throw new PublicError(502, 'Coze 返回业务错误', {
      code: payload.code,
      msg: payload.msg
    });
  }

  const messages = payload?.data?.messages || payload?.messages || [];
  const answer = messages.find((message) => message.type === 'answer');

  return {
    answer: answer?.content || '',
    debug: { code: payload?.code, msg: payload?.msg, status: payload?.data?.status },
    eventCount: messages.length,
    mode: 'json'
  };
}

function extractAnswerFromSse(rawText) {
  const events = rawText.split(/\n\n+/).map(parseSseBlock).filter(Boolean);
  const deltaText = events.map(readAnswerDelta).join('');
  const completed = events.map(readCompletedAnswer).filter(Boolean).at(-1);
  const failed = events.find((event) => event.name.includes('failed'));

  if (failed) {
    throw new PublicError(502, 'Coze 对话执行失败', { data: failed.data, event: failed.name });
  }

  return {
    answer: deltaText || completed || '',
    debug: { events: events.map((event) => event.name) },
    eventCount: events.length,
    mode: 'sse'
  };
}

function parseSseBlock(block) {
  const lines = block.split('\n').map((line) => line.trim());
  const name = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
  const dataText = lines.filter((line) => line.startsWith('data:')).map(readDataLine).join('');
  if (!name || !dataText || dataText === '[DONE]') {
    return null;
  }

  return { data: JSON.parse(dataText), name };
}

function readDataLine(line) {
  return line.slice(5).trim();
}

function readAnswerDelta(event) {
  const data = event.data;
  if (!event.name.endsWith('.delta') || !isAnswerMessage(data)) {
    return '';
  }

  return data.content || '';
}

function readCompletedAnswer(event) {
  const data = event.data;
  if (!event.name.endsWith('.completed') || !isAnswerMessage(data)) {
    return '';
  }

  return data.content || '';
}

function isAnswerMessage(data) {
  return data?.role === 'assistant' && data?.type === 'answer';
}

async function uploadImageFile(options) {
  try {
    const file = Readable.from(options.imageFile.buffer);
    file.path = options.imageFile.originalname;
    return await options.client.files.upload({ file });
  } catch (error) {
    throw new PublicError(502, 'Coze 图片上传失败', { cause: readErrorMessage(error) });
  }
}

function buildImageMessage(options) {
  const message = options.message?.trim() || DEFAULT_IMAGE_PROMPT;
  return {
    content: [
      { text: message, type: 'text' },
      { file_id: options.fileId, type: 'image' }
    ],
    content_type: 'object_string',
    role: RoleType.User
  };
}

function buildImageChatResult(options) {
  return {
    answer: options.answer,
    coze: {
      eventCount: options.eventCount,
      mode: 'sdk',
      status: 'completed'
    },
    imageMeta: {
      fileId: options.uploadedFile.id,
      name: options.imageFile.originalname,
      size: options.imageFile.size
    }
  };
}

async function collectImageAnswer(stream) {
  let completedAnswer = '';
  let deltaAnswer = '';
  let eventCount = 0;

  for await (const part of stream) {
    eventCount += 1;
    if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA && isAnswerMessage(part.data)) {
      deltaAnswer += part.data.content || '';
    }
    if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && isAnswerMessage(part.data)) {
      completedAnswer = part.data.content || completedAnswer;
    }
    if (part.event === ChatEventType.CONVERSATION_CHAT_FAILED || part.event === ChatEventType.ERROR) {
      throw new PublicError(502, 'Coze 图片对话执行失败', { data: part.data, event: part.event });
    }
  }

  const answer = deltaAnswer || completedAnswer;
  if (!answer) {
    throw new PublicError(502, 'Coze 返回中未找到 answer 消息', { eventCount });
  }

  return { answer, eventCount };
}

function readErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return '未知错误';
}
