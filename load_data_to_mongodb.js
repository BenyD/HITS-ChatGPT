import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

// Load environment variables from .env
dotenv.config();

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HF_API_TOKEN);

async function loadData() {
  // Ensure MONGODB_URI is defined
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  // Initialize MongoDB client
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB successfully.");

    const db = client.db("UniversityDB");
    const collection = db.collection("contexts");

    // Load data from dataset.json
    const rawData = readFileSync("dataset.json", "utf-8").split("\n");
    console.log("Loaded data from dataset.json.");

    const documents = rawData
      .map((line) => {
        line = line.trim(); // Remove any leading/trailing whitespace
        if (line) {
          try {
            return JSON.parse(line);
          } catch (error) {
            console.error("Invalid JSON line skipped:", line, error.message);
            return null;
          }
        }
        return null; // Skip empty lines
      })
      .filter((entry) => entry !== null); // Remove null entries

    console.log(`Parsed ${documents.length} valid entries from dataset.json.`);

    // Process each document, add embeddings, and prepare for MongoDB insertion
    const documentsWithEmbeddings = await Promise.all(
      documents.map(async (entry) => {
        const embedding = await hf.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: entry.question,
        });

        return {
          question: entry.question,
          context: entry.context,
          answer: entry.answer,
          embedding,
        };
      })
    );

    // Clear existing documents (optional)
    const deleteResult = await collection.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing documents.`);

    // Insert new documents with embeddings
    const insertResult = await collection.insertMany(documentsWithEmbeddings);
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

// Run the loadData function
loadData().catch(console.error);
