import { useState } from "react";
import { DEFAULT_IMAGE_PROMPT, sendAgentImageChat, sendAgentTextChat } from "../api/agent";

const DEFAULT_USER_MESSAGE = "请识别这张餐食图片的热量和营养素。";
const MAX_IMAGE_SIZE_MB = 8;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AgentMessage = {
  id: string;
  imageName?: string;
  imagePreviewUrl?: string;
  role: "assistant" | "error" | "user";
  text: string;
};

export type SelectedImage = {
  file: File;
  previewUrl: string;
};

export function useAgentChat() {
  const [error, setError] = useState("");
  const [inputText, setInputText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  return {
    closeDrawer: () => setIsOpen(false),
    error,
    inputText,
    isOpen,
    isSending,
    messages,
    openDrawer: (prompt?: string) => {
      if (typeof prompt === "string") {
        setInputText(prompt);
      }
      setError("");
      setIsOpen(true);
    },
    removeImage: () => setSelectedImage(null),
    selectImage: (file?: File) => handleSelectImage({ file, setError, setSelectedImage }),
    selectedImage,
    setInputText,
    submitMessage: () =>
      handleSubmitMessage({
        inputText,
        isSending,
        selectedImage,
        setError,
        setInputText,
        setIsSending,
        setMessages,
        setSelectedImage
      })
  };
}

async function handleSelectImage(options: {
  file?: File;
  setError: (value: string) => void;
  setSelectedImage: (value: SelectedImage | null) => void;
}) {
  if (!options.file) {
    return;
  }
  try {
    validateImage(options.file);
    const previewUrl = await readImagePreview(options.file);
    options.setSelectedImage({ file: options.file, previewUrl });
    options.setError("");
  } catch (caughtError) {
    options.setSelectedImage(null);
    options.setError(readErrorMessage(caughtError));
  }
}

async function handleSubmitMessage(options: {
  inputText: string;
  isSending: boolean;
  selectedImage: SelectedImage | null;
  setError: (value: string) => void;
  setInputText: (value: string) => void;
  setIsSending: (value: boolean) => void;
  setMessages: (updater: (currentMessages: AgentMessage[]) => AgentMessage[]) => void;
  setSelectedImage: (value: SelectedImage | null) => void;
}) {
  if (options.isSending) {
    return;
  }
  const textMessage = options.inputText.trim();
  if (!options.selectedImage && !textMessage) {
    options.setError("请输入想问 Agent 的内容，或上传餐食图片");
    return;
  }

  const selectedImage = options.selectedImage;
  const message = textMessage || DEFAULT_IMAGE_PROMPT;
  options.setMessages((currentMessages) => [...currentMessages, buildUserMessage(message, selectedImage)]);
  options.setIsSending(true);
  options.setError("");

  try {
    const response = selectedImage
      ? await sendAgentImageChat({ image: selectedImage.file, message })
      : await sendAgentTextChat({ message });
    options.setMessages((currentMessages) => [...currentMessages, createMessage("assistant", response.answer)]);
    options.setInputText("");
    options.setSelectedImage(null);
  } catch (caughtError) {
    const messageText = readErrorMessage(caughtError);
    options.setError(messageText);
    options.setMessages((currentMessages) => [...currentMessages, createMessage("error", messageText)]);
  } finally {
    options.setIsSending(false);
  }
}

function validateImage(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("仅支持 JPG、PNG 或 WEBP 图片");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`图片不能超过 ${MAX_IMAGE_SIZE_MB} MB`);
  }
}

function readImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("图片预览读取失败"));
    reader.readAsDataURL(file);
  });
}

function buildUserMessage(message: string, selectedImage: SelectedImage | null): AgentMessage {
  return {
    id: crypto.randomUUID(),
    imageName: selectedImage?.file.name,
    imagePreviewUrl: selectedImage?.previewUrl,
    role: "user",
    text: selectedImage && !message.trim() ? DEFAULT_USER_MESSAGE : message
  };
}

function readErrorMessage(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : "图片识别失败";
}

function createMessage(role: AgentMessage["role"], text: string): AgentMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text
  };
}
