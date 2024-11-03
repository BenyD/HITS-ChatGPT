import { NextApiRequest, NextApiResponse } from "next";
import { MongoClient } from "mongodb";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_TOKEN as string);
const uri = process.env.MONGODB_URI as string;

let cachedDb: MongoClient | null = null;

async function getDatabase() {
  if (cachedDb) return cachedDb.db("UniversityDB");

  const client = new MongoClient(uri);
  await client.connect();
  cachedDb = client;
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
  try {
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
    console.log("Matched Context:", bestMatch?.context || "No context found");

    return highestScore > 0.3 ? bestMatch?.context : null;
  } catch (error) {
    console.error("Error finding similar context:", error);
    return null;
  }
}

function cleanOutput(text: string): string {
  return text.replace(/(^.*Context:|Answer:|\\n)/g, "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;
  console.log("Received question:", question);

  try {
    const context = await findSimilarContext(question);

    if (!context) {
      console.warn("No relevant context found for question:", question);
      return res.status(200).json({
        answer:
          "I'm sorry, I couldn't find relevant information. Please try asking differently or check the handbook.",
      });
    }

    console.log("Using context:", context);

    let response;
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      response = await fetch(
        "https://api-inference.huggingface.co/models/BenyD/FLAN-T5-Small-College-Chat",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Question: ${question}. Context: ${context}. Answer concisely.`,
            parameters: {
              max_new_tokens: 100,
              temperature: 0.7,
              top_p: 0.9,
            },
          }),
        }
      );

      const data = await response.json();
      console.log("Model response data:", data);

      if (data.error) {
        if (data.error.includes("currently loading")) {
          console.log(
            `Model is loading. Retrying in 5 seconds... (Attempt ${
              attempt + 1
            }/${maxAttempts})`
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        } else {
          console.error("Unexpected response error:", data.error);
          return res.status(200).json({
            answer:
              "I'm sorry, I couldn't retrieve a detailed answer. Please try again later.",
          });
        }
      } else if (data[0]?.generated_text) {
        let answer = cleanOutput(data[0].generated_text);

        // Fallback to context if answer seems too generic or unrelated
        if (
          !answer ||
          answer.length < 5 ||
          !answer.includes(context.split(",")[0])
        ) {
          console.log("Using fallback answer based on context.");
          answer = context;
        }

        console.log("Final Answer:", answer);
        return res.status(200).json({ answer });
      } else {
        console.log("Unexpected response format:", data);
        return res.status(200).json({
          answer:
            "I'm sorry, I couldn't retrieve a detailed answer. Please try again later.",
        });
      }
    }

    console.error("Exceeded max retry attempts due to model loading issues.");
    return res.status(200).json({
      answer:
        "I'm sorry, the model is taking longer than expected to load. Please try again later.",
    });
  } catch (error) {
    console.error("Error calling the Hugging Face API or MongoDB:", error);
    return res.status(500).json({
      answer: "An error occurred. Please try again later.",
    });
  }
}
