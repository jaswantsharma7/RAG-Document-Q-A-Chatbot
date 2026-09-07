import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import documentsRouter from "./routes/documents.js";
import chatRouter from "./routes/chat.js";
import healthRouter from "./routes/health.js";
import { notFoundHandler, errorHandler } from "./utils/errorHandler.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
  })
);
app.use(express.json({ limit: "2mb" }));

app.use("/api/health", healthRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/chat", chatRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`RAG Document Q&A backend listening on port ${config.port}`);
});
