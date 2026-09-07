import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 5000),
  googleApiKey: requireEnv("GOOGLE_API_KEY"),
  chromaUrl: process.env.CHROMA_URL || "http://localhost:8000",
  chromaCollectionName: process.env.CHROMA_COLLECTION_NAME || "rag_documents",
  embeddingModel: process.env.EMBEDDING_MODEL || "gemini-embedding-001",
  chatModel: process.env.CHAT_MODEL || "gemini-2.5-flash",
  chunkSize: Number(process.env.CHUNK_SIZE || 1000),
  chunkOverlap: Number(process.env.CHUNK_OVERLAP || 150),
  topK: Number(process.env.TOP_K_RESULTS || 4),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 15),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
