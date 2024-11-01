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

    // Load data from formatted_training_data.txt
    const data = readFileSync("formatted_training_data.txt", "utf-8").split(
      "\n"
    );
    console.log("Loaded data from formatted_training_data.txt.");

    const documents = [];
    let entry = { question: "", context: "", answer: "" };

    // Parse each line of the text file
    data.forEach((line) => {
      if (line.startsWith("Question:")) {
        entry.question = line.replace("Question:", "").trim();
      } else if (line.startsWith("Context:")) {
        entry.context = line.replace("Context:", "").trim();
      } else if (line.startsWith("Answer:")) {
        entry.answer = line.replace("Answer:", "").trim();
        documents.push({ ...entry }); // Save the complete entry
        entry = { question: "", context: "", answer: "" }; // Reset entry for the next block
      }
    });

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
