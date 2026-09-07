import { useState } from "react";
import DocumentPanel from "./components/DocumentPanel.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import { useChat } from "./hooks/useChat.js";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [activeSourceId, setActiveSourceId] = useState(null);

  const { messages, isStreaming, error, sendMessage, stopStreaming, resetChat } =
    useChat(activeSourceId);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>RAG Document Q&A Chatbot</h1>
        <p>Ask questions about your PDFs and get answers grounded in their content.</p>
      </header>

      <main className="app-main">
        <DocumentPanel
          documents={documents}
          setDocuments={setDocuments}
          activeSourceId={activeSourceId}
          setActiveSourceId={setActiveSourceId}
        />

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          onSend={sendMessage}
          onStop={stopStreaming}
          onReset={resetChat}
          disabled={documents.length === 0}
        />
      </main>
    </div>
  );
}
