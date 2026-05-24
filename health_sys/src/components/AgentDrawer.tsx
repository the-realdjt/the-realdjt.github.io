import { useEffect, useId, useRef, type ChangeEvent, type FormEvent, type MouseEvent, type RefObject } from "react";
import { Bot, ImagePlus, LoaderCircle, Send, X } from "lucide-react";
import type { AgentMessage, SelectedImage } from "../hooks/useAgentChat";

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

type AgentDrawerProps = {
  error: string;
  inputText: string;
  isOpen: boolean;
  isSending: boolean;
  messages: AgentMessage[];
  onClose: () => void;
  onInputTextChange: (value: string) => void;
  onRemoveImage: () => void;
  onSelectImage: (file?: File) => Promise<void>;
  onSubmit: () => Promise<void>;
  selectedImage: SelectedImage | null;
};

export function AgentDrawer(props: AgentDrawerProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (props.isOpen) {
      uploadButtonRef.current?.focus();
    }
  }, [props.isOpen]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <div className="agent-drawer-backdrop" onClick={props.onClose}>
      <DrawerPanel
        {...props}
        fileInputId={fileInputId}
        fileInputRef={fileInputRef}
        uploadButtonRef={uploadButtonRef}
      />
    </div>
  );
}

type DrawerPanelProps = AgentDrawerProps & {
  fileInputId: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadButtonRef: RefObject<HTMLButtonElement | null>;
};

function DrawerPanel(props: DrawerPanelProps) {
  return (
    <aside className="agent-drawer-panel" id="agent-drawer" role="dialog" aria-label="餐食识别 Agent" aria-modal="true" onClick={stopPropagation}>
      <DrawerHeader onClose={props.onClose} />
      <section className="agent-thread" aria-label="Agent 对话消息">
        {props.messages.length === 0 ? <EmptyState /> : props.messages.map((message) => <MessageBubble key={message.id} message={message} />)}
      </section>
      <AgentComposer
        error={props.error}
        fileInputId={props.fileInputId}
        fileInputRef={props.fileInputRef}
        inputText={props.inputText}
        isSending={props.isSending}
        onInputTextChange={props.onInputTextChange}
        onRemoveImage={props.onRemoveImage}
        onSelectImage={props.onSelectImage}
        onSubmit={props.onSubmit}
        selectedImage={props.selectedImage}
        uploadButtonRef={props.uploadButtonRef}
      />
    </aside>
  );
}

function DrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="agent-drawer-header">
      <div>
        <p className="agent-drawer-label">健康推荐 Agent</p>
        <h2>在对话里询问餐单、运动或上传餐食图片</h2>
      </div>
      <button className="agent-drawer-close" type="button" aria-label="关闭 Agent 对话" onClick={onClose}>
        <X size={18} />
      </button>
    </header>
  );
}

function EmptyState() {
  return (
    <div className="agent-empty-state">
      <span className="agent-empty-icon">
        <Bot size={22} />
      </span>
      <div>
        <strong>可以直接提问，也可以上传餐食图片让 Agent 估算热量。</strong>
        <p>例如询问减脂餐单、初学者运动，或补充餐次和份量后发送图片。</p>
      </div>
    </div>
  );
}

type AgentComposerProps = {
  error: string;
  fileInputId: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  inputText: string;
  isSending: boolean;
  onInputTextChange: (value: string) => void;
  onRemoveImage: () => void;
  onSelectImage: (file?: File) => Promise<void>;
  onSubmit: () => Promise<void>;
  selectedImage: SelectedImage | null;
  uploadButtonRef: RefObject<HTMLButtonElement | null>;
};

function AgentComposer(props: AgentComposerProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await props.onSubmit();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    await props.onSelectImage(file);
    event.target.value = "";
  }

  return (
    <form className="agent-composer" onSubmit={handleSubmit}>
      <input
        accept={ACCEPTED_IMAGE_TYPES}
        className="agent-file-input"
        disabled={props.isSending}
        id={props.fileInputId}
        ref={props.fileInputRef}
        type="file"
        onChange={handleFileChange}
      />
      <UploadControls fileInputId={props.fileInputId} isSending={props.isSending} onPickImage={() => props.fileInputRef.current?.click()} uploadButtonRef={props.uploadButtonRef} />
      {props.selectedImage ? <SelectedImageCard image={props.selectedImage} onRemove={props.onRemoveImage} /> : null}
      <label className="agent-input-label" htmlFor="agent-message">
        补充说明
      </label>
      <textarea
        className="agent-textarea"
        disabled={props.isSending}
        id="agent-message"
        placeholder="例如：这是我的午饭，请估算总热量和三大营养素。"
        rows={3}
        value={props.inputText}
        onChange={(event) => props.onInputTextChange(event.target.value)}
      />
      {props.error ? <p className="agent-error-text" role="alert">{props.error}</p> : null}
      <ComposerFooter isSending={props.isSending} />
    </form>
  );
}

type UploadControlsProps = {
  fileInputId: string;
  isSending: boolean;
  onPickImage: () => void;
  uploadButtonRef: RefObject<HTMLButtonElement | null>;
};

function UploadControls(props: UploadControlsProps) {
  return (
    <div className="agent-upload-bar">
      <button className="agent-upload-button" ref={props.uploadButtonRef} type="button" disabled={props.isSending} onClick={props.onPickImage}>
        <ImagePlus size={16} />
        上传餐食图片
      </button>
      <label className="agent-upload-hint" htmlFor={props.fileInputId}>
        支持 JPG、PNG、WEBP，大小不超过 8 MB
      </label>
    </div>
  );
}

function ComposerFooter({ isSending }: { isSending: boolean }) {
  return (
    <div className="agent-composer-footer">
      <span>未上传图片时会发起文本对话；上传后会一起发送给 Agent。</span>
      <button className="agent-submit-button" type="submit" disabled={isSending}>
        {isSending ? <LoaderCircle className="agent-spin" size={16} /> : <Send size={16} />}
        {isSending ? "发送中" : "发送"}
      </button>
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  return (
    <article className={`agent-message agent-message-${message.role}`}>
      <span className="agent-message-role">{readRoleLabel(message.role)}</span>
      <div className="agent-message-body">
        <p>{message.text}</p>
        {message.imagePreviewUrl ? (
          <figure className="agent-message-image">
            <img alt={message.imageName || "已上传餐食图片"} src={message.imagePreviewUrl} />
            <figcaption>{message.imageName}</figcaption>
          </figure>
        ) : null}
      </div>
    </article>
  );
}

function SelectedImageCard(props: { image: SelectedImage; onRemove: () => void }) {
  return (
    <div className="agent-selected-image">
      <img alt={props.image.file.name} src={props.image.previewUrl} />
      <div>
        <strong>{props.image.file.name}</strong>
        <small>{formatFileSize(props.image.file.size)}</small>
      </div>
      <button type="button" aria-label="移除已选图片" onClick={props.onRemove}>
        <X size={16} />
      </button>
    </div>
  );
}

function formatFileSize(sizeInBytes: number): string {
  const sizeInKb = sizeInBytes / 1024;
  return `${sizeInKb.toFixed(1)} KB`;
}

function readRoleLabel(role: AgentMessage["role"]): string {
  if (role === "assistant") {
    return "Agent";
  }
  if (role === "error") {
    return "Error";
  }
  return "你";
}

function stopPropagation(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}
