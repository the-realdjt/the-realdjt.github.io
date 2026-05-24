import { AgentDrawer } from "./components/AgentDrawer";
import { DashboardPage } from "./components/DashboardSections";
import { useAgentChat } from "./hooks/useAgentChat";

export default function App() {
  const agentChat = useAgentChat();

  return (
    <main className="app-shell" aria-label="健康管理应用">
      <DashboardPage onOpenAgentChat={agentChat.openDrawer} />
      <AgentDrawer
        error={agentChat.error}
        inputText={agentChat.inputText}
        isOpen={agentChat.isOpen}
        isSending={agentChat.isSending}
        messages={agentChat.messages}
        onClose={agentChat.closeDrawer}
        onInputTextChange={agentChat.setInputText}
        onRemoveImage={agentChat.removeImage}
        onSelectImage={agentChat.selectImage}
        onSubmit={agentChat.submitMessage}
        selectedImage={agentChat.selectedImage}
      />
    </main>
  );
}
