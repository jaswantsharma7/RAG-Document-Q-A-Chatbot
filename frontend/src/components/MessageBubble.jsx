export default function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "message message-user" : "message message-assistant"}>
      <div className="message-role">{isUser ? "You" : "Assistant"}</div>
      <div className="message-content">
        {message.content || (isStreaming ? "Thinking..." : "")}
      </div>

      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="message-sources">
          <span className="sources-label">Sources:</span>
          <ul>
            {message.sources.map((source, index) => (
              <li key={index}>
                {source.fileName || "Unknown file"}
                {source.page != null ? `, page ${source.page}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
