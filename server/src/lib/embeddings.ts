import { MistralAIEmbeddings } from "@langchain/mistralai";

export const embeddings = new MistralAIEmbeddings({
  apiKey: process.env.MISTRAL_API_KEY!,
  model: "mistral-embed",
});
