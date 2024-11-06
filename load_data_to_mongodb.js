import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

// Load environment variables
dotenv.config();

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HF_API_TOKEN);

async function loadData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB successfully.");

    const db = client.db("UniversityDB");
    const collection = db.collection("contexts");

    // Load data from dataset.json
    const rawData = JSON.parse(readFileSync("dataset.json", "utf-8"));
    console.log(`Loaded ${rawData.length} entries from dataset.json.`);

    const documentsWithEmbeddings = await Promise.all(
      rawData.map(async (entry) => {
        try {
          const embedding = await hf.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: entry.question,
          });

          if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error("Invalid embedding");
          }

          return {
            question: entry.question,
            context: entry.context,
            embedding,
          };
        } catch (error) {
          console.error(
            `Failed to generate embedding for question: ${entry.question}`,
            error.message
          );
          return null;
        }
      })
    );

    const validDocuments = documentsWithEmbeddings.filter(
      (doc) => doc !== null
    );

    // Clear existing documents and insert new ones
    await collection.deleteMany({});
    console.log("Cleared existing documents.");

    const insertResult = await collection.insertMany(validDocuments);
    console.log(
      `Inserted ${insertResult.insertedCount} new documents into MongoDB.`
    );
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

loadData().catch(console.error);
