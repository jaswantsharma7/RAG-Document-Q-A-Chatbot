import { Chroma } from "@langchain/community/vectorstores/chroma";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

let vectorStoreInstance = null;

function buildEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: config.googleApiKey,
    model: config.embeddingModel,
  });
}

export async function getVectorStore() {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  const embeddings = buildEmbeddings();

  vectorStoreInstance = new Chroma(embeddings, {
    collectionName: config.chromaCollectionName,
    url: config.chromaUrl,
  });

  try {
    await vectorStoreInstance.ensureCollection();
  } catch (error) {
    logger.error("Failed to connect to Chroma vector store", error.message);
    throw new Error(
      "Vector database is not reachable. Confirm the Chroma server is running and CHROMA_URL is correct."
    );
  }

  return vectorStoreInstance;
}

export async function addDocumentsToStore(documents) {
  const store = await getVectorStore();

  const probe = await store.embeddings.embedQuery(documents[0]?.pageContent || "test");
  if (!Array.isArray(probe) || probe.length === 0) {
    throw new Error(
      "The embeddings API returned an empty vector. Check GOOGLE_API_KEY and EMBEDDING_MODEL are valid."
    );
  }

  const ids = await store.addDocuments(documents);
  logger.info(`Added ${documents.length} chunks to vector store`);
  return ids;
}

export async function similaritySearch(query, k = config.topK, filter = undefined) {
  const store = await getVectorStore();
  const results = await store.similaritySearchWithScore(query, k, filter);
  return results.map(([doc, score]) => ({
    content: doc.pageContent,
    metadata: doc.metadata,
    score,
  }));
}

export async function deleteDocumentBySourceId(sourceId) {
  const store = await getVectorStore();
  const collection = await store.ensureCollection();
  await collection.delete({ where: { sourceId } });
  logger.info(`Deleted chunks for sourceId ${sourceId}`);
}
