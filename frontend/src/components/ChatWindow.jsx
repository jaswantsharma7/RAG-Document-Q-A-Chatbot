import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ messages, isStreaming, error, onSend, onStop, onReset, disabled }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>Chat</h2>
        <button type="button" className="reset-button" onClick={onReset} disabled={messages.length === 0}>
          Clear conversation
        </button>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="empty-text">Upload a PDF and ask a question to get started.</p>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.role === "assistant"}
          />
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={disabled ? "Upload a document to start asking questions" : "Ask a question about your documents"}
          disabled={disabled}
        />
        {isStreaming ? (
          <button type="button" onClick={onStop} className="stop-button">
            Stop
          </button>
        ) : (
          <button type="submit" disabled={disabled || !input.trim()}>
            Send
          </button>
        )}
      </form>
    </div>
  );
}
