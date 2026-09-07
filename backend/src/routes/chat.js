import { Router } from "express";
import { streamAnswer } from "../services/chatService.js";
import { logger } from "../utils/logger.js";

const router = Router();

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post("/stream", async (req, res) => {
  const { question, history, sourceId } = req.body || {};

  if (!question || typeof question !== "string" || !question.trim()) {
    res.status(400).json({ error: "A non-empty question is required." });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });

  try {
    const { sources } = await streamAnswer({
      question: question.trim(),
      history: Array.isArray(history) ? history : [],
      sourceId: sourceId || undefined,
      onToken: (token) => {
        sendEvent(res, "token", { token });
      },
    });

    sendEvent(res, "sources", { sources });
    sendEvent(res, "done", { finished: true });
  } catch (error) {
    logger.error("Streaming chat failed", error.message);
    sendEvent(res, "error", { message: error.message || "Failed to generate a response." });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

export default router;
