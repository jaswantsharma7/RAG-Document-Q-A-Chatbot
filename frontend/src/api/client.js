const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Upload failed.");
  }

  return data.document;
}

export async function deleteDocument(sourceId) {
  const response = await fetch(`${API_BASE_URL}/api/documents/${sourceId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete document.");
  }
}

export function streamChatAnswer({ question, history, sourceId, onToken, onSources, onDone, onError }) {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history, sourceId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reach the chat service.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          if (!rawEvent.trim() || rawEvent.startsWith(":")) continue;

          const lines = rawEvent.split("\n");
          let eventName = "message";
          let dataLine = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.replace("event:", "").trim();
            } else if (line.startsWith("data:")) {
              dataLine = line.replace("data:", "").trim();
            }
          }

          if (!dataLine) continue;
          const payload = JSON.parse(dataLine);

          if (eventName === "token") {
            onToken(payload.token);
          } else if (eventName === "sources") {
            onSources(payload.sources || []);
          } else if (eventName === "error") {
            onError(new Error(payload.message));
          } else if (eventName === "done") {
            onDone();
          }
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        onError(error);
      }
    }
  })();

  return () => controller.abort();
}
