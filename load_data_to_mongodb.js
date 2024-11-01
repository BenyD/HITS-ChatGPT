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

    const db = client.db("UniversityDB"); // Ensure this matches your database name
    const collection = db.collection("contexts");

    // Load data from JSON file
    const data = JSON.parse(readFileSync("training_data.json", "utf-8"));
    console.log("Loaded data from training_data.json.");

    // Prepare documents with embeddings for insertion
    const documents = await Promise.all(
      data.map(async (entry) => {
        const embedding = await hf.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: entry.question,
        });

        return {
          question: entry.question,
          context: entry.context,
          embedding, // Save the embedding for similarity matching
        };
      })
    );

    // Clear existing documents (optional, for reloading data)
    const deleteResult = await collection.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing documents.`);

    // Insert new documents with embeddings
    const insertResult = await collection.insertMany(documents);
    console.log(
      `Inserted ${insertResult.insertedCount} new documents into MongoDB.`
    );
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    // Ensure the MongoDB client is closed
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

// Run the loadData function
loadData().catch(console.error);
