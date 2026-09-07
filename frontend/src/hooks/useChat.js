import { useCallback, useRef, useState } from "react";
import { streamChatAnswer } from "../api/client.js";

export function useChat(activeSourceId) {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const cancelRef = useRef(null);

  const sendMessage = useCallback(
    (question) => {
      if (!question.trim() || isStreaming) return;

      setError(null);

      const history = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const userMessage = { role: "user", content: question, id: `${Date.now()}-user` };
      const assistantMessage = {
        role: "assistant",
        content: "",
        id: `${Date.now()}-assistant`,
        sources: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      cancelRef.current = streamChatAnswer({
        question,
        history,
        sourceId: activeSourceId,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content: message.content + token }
                : message
            )
          );
        },
        onSources: (sources) => {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessage.id ? { ...message, sources } : message
            )
          );
        },
        onDone: () => {
          setIsStreaming(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsStreaming(false);
        },
      });
    },
    [messages, isStreaming, activeSourceId]
  );

  const stopStreaming = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      setIsStreaming(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, resetChat };
}
