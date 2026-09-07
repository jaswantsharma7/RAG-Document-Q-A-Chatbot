import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../config/env.js";
import { similaritySearch } from "./vectorStore.js";
import { logger } from "../utils/logger.js";

const SYSTEM_PROMPT = `You are a document assistant. Answer the user's question using only the
provided context extracted from their uploaded documents. If the context does not contain
the answer, say that you could not find the answer in the uploaded documents rather than
guessing. Keep answers clear and cite the source file name and page number when relevant.`;

function buildContextBlock(matches) {
  if (!matches.length) {
    return "No relevant context was found in the uploaded documents.";
  }

  return matches
    .map((match, index) => {
      const page = match.metadata?.page != null ? `page ${match.metadata.page}` : "unknown page";
      const source = match.metadata?.fileName || "unknown source";
      return `[Context ${index + 1} | ${source} | ${page}]\n${match.content}`;
    })
    .join("\n\n");
}

function buildChatModel() {
  return new ChatGoogleGenerativeAI({
    apiKey: config.googleApiKey,
    model: config.chatModel,
    temperature: 0.2,
    streaming: true,
  });
}

export async function retrieveContext(question, sourceId) {
  const filter = sourceId ? { sourceId } : undefined;
  const matches = await similaritySearch(question, config.topK, filter);
  return matches;
}

export async function streamAnswer({ question, history = [], sourceId, onToken }) {
  const matches = await retrieveContext(question, sourceId);
  const contextBlock = buildContextBlock(matches);

  const chatModel = buildChatModel();

  const conversationMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    {
      role: "user",
      content: `Context from uploaded documents:\n\n${contextBlock}\n\nQuestion: ${question}`,
    },
  ];

  let fullAnswer = "";

  const stream = await chatModel.stream(conversationMessages);

  for await (const chunk of stream) {
    const token = chunk?.content ?? "";
    if (token) {
      fullAnswer += token;
      onToken(token);
    }
  }

  logger.info(`Generated answer of length ${fullAnswer.length} for question`, { sourceId });

  return {
    answer: fullAnswer,
    sources: matches.map((match) => ({
      fileName: match.metadata?.fileName,
      page: match.metadata?.page,
      score: match.score,
    })),
  };
}
