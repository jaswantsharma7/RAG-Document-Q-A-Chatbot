import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from "../config/env.js";
import { addDocumentsToStore } from "./vectorStore.js";
import { logger } from "../utils/logger.js";

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: config.chunkSize,
  chunkOverlap: config.chunkOverlap,
});

export async function ingestPdf(filePath, originalName) {
  const sourceId = uuidv4();

  const loader = new PDFLoader(filePath, { splitPages: true });
  const rawDocs = await loader.load();

  if (!rawDocs.length || rawDocs.every((doc) => !doc.pageContent.trim())) {
    throw new Error("No extractable text was found in the uploaded PDF.");
  }

  const chunks = await splitter.splitDocuments(rawDocs);

  const enrichedChunks = chunks.map((chunk, index) => ({
    pageContent: chunk.pageContent,
    metadata: {
      sourceId,
      fileName: originalName,
      page: chunk.metadata?.loc?.pageNumber ?? null,
      chunkIndex: index,
      ingestedAt: new Date().toISOString(),
    },
  }));

  await addDocumentsToStore(enrichedChunks);

  await fs.unlink(filePath).catch((err) => {
    logger.warn(`Could not remove temp upload file ${filePath}`, err.message);
  });

  return {
    sourceId,
    fileName: originalName,
    pageCount: rawDocs.length,
    chunkCount: enrichedChunks.length,
  };
}
