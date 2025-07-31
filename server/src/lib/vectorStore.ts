import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings";

const initialiseVectorStore = async ({
  collectionName,
}: {
  collectionName: string;
}) => {
  let vectorStore: any = null;

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: collectionName,
  });

  return vectorStore;
};

export { initialiseVectorStore };
