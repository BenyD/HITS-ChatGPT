import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HF_API_TOKEN!);

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = "UniversityDB"; // Database name
const MONGODB_COLLECTION = "contexts"; // Collection name

// Function to flatten embedding responses
function flattenEmbedding(embedding: number | number[] | number[][]): number[] {
  if (Array.isArray(embedding)) {
    if (Array.isArray(embedding[0])) {
      // Handles the case of nested arrays
      return embedding[0] as number[];
    }
    return embedding as number[];
  }
  return [embedding];
}

// Function to calculate cosine similarity
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  const dotProduct = vectorA.reduce((sum, a, idx) => sum + a * vectorB[idx], 0);
  const magnitudeA = Math.sqrt(
    vectorA.reduce((sum, val) => sum + val * val, 0)
  );
  const magnitudeB = Math.sqrt(
    vectorB.reduce((sum, val) => sum + val * val, 0)
  );
  return dotProduct / (magnitudeA * magnitudeB);
}

// API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed." });
  }

  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    // Get question embedding from Hugging Face
    const questionEmbeddingResponse = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: question,
    });

    const questionEmbedding = flattenEmbedding(
      questionEmbeddingResponse as number[] | number[][]
    );

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const collection = client.db(MONGODB_DB).collection(MONGODB_COLLECTION);

    // Fetch all stored contexts
    const contexts = await collection.find({}).toArray();

    // Calculate cosine similarity for each context
    const similarities = contexts.map((doc) => {
      const contextEmbedding = flattenEmbedding(doc.embedding);
      const similarity = cosineSimilarity(questionEmbedding, contextEmbedding);
      return { context: doc.context, similarity };
    });

    // Find the most similar context
    const bestMatch = similarities.sort(
      (a, b) => b.similarity - a.similarity
    )[0];

    await client.close();

    if (bestMatch.similarity < 0.7) {
      return res.status(200).json({
        answer: "No relevant context found for your question.",
      });
    }

    return res.status(200).json({ answer: bestMatch.context });
  } catch (error) {
    console.error("Error handling question:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
}
