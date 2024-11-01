import type { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import { HfInference } from "@huggingface/inference";

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HF_API_TOKEN);
const uri = process.env.MONGODB_URI;

async function getDatabase() {
  const client = new MongoClient(uri as string);
  await client.connect();
  return client.db("UniversityDB");
}

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  const dotProduct = vectorA.reduce((sum, a, idx) => sum + a * vectorB[idx], 0);
  const magnitudeA = Math.sqrt(
    vectorA.reduce((sum, val) => sum + val * val, 0)
  );
  const magnitudeB = Math.sqrt(
    vectorB.reduce((sum, val) => sum + val * val, 0)
  );
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

async function getEmbedding(question: string): Promise<number[]> {
  const embeddingResult = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: question,
  });
  return embeddingResult as number[];
}

async function findSimilarContext(question: string) {
  const db = await getDatabase();
  const collection = db.collection("contexts");

  const questionEmbedding = await getEmbedding(question);

  const contexts = await collection.find().toArray();
  let bestMatch = null;
  let highestScore = 0;

  for (const context of contexts) {
    const similarity = cosineSimilarity(questionEmbedding, context.embedding);
    if (similarity > highestScore) {
      highestScore = similarity;
      bestMatch = context;
    }
  }

  console.log("Best similarity score:", highestScore);
  return highestScore > 0.7 ? bestMatch?.context : null;
}

function cleanOutput(text: string): string {
  return text.replace(/(^.*Context:|Answer:|\\n)/g, "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { question } = req.body;
    console.log("Received question:", question);

    const context = await findSimilarContext(question);
    if (!context) {
      return res.status(400).json({
        answer:
          "I'm sorry, I couldn't find relevant information. Please try asking differently or check the handbook.",
      });
    }

    console.log("Using context:", context);

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/BenyD/Mistral-College-Chat",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Context: ${context}\nQuestion: ${question}\nAnswer:`,
            parameters: {
              max_new_tokens: 150,
              temperature: 0.7,
              top_p: 0.9,
              stop: ["\n", "Question:", "Context:"],
            },
          }),
        }
      );

      const data = await response.json();
      console.log("Model response:", data);

      let answer =
        data[0]?.generated_text ||
        "I'm sorry, I couldn't retrieve a confident answer.";
      answer = cleanOutput(answer);

      res.status(200).json({ answer });
    } catch (error) {
      console.error("Error calling the Hugging Face API:", error);
      res
        .status(500)
        .json({ error: "Error fetching the response from the model." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
