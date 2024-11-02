import os
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer, Trainer, TrainingArguments
from datasets import Dataset
from huggingface_hub import login
import logging

# Setup logging for monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check for GPU availability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# Authenticate with Hugging Face
hf_api_token = os.getenv("HF_API_TOKEN")
if not hf_api_token:
    raise ValueError("Please set the HF_API_TOKEN environment variable")

login(token=hf_api_token)

# Define the model and tokenizer IDs
model_name = "google/flan-t5-small"

# Load and format data
formatted_data = []
with open('dataset.json', 'r') as f:
    for line in f:
        formatted_data.append(eval(line.strip()))

logger.info(f"Loaded {len(formatted_data)} entries from training data.")

# Create the dataset
dataset = Dataset.from_dict({
    "input_text": [f"question: {item['question']} context: {item['context']}" for item in formatted_data],
    "output_text": [item["answer"] for item in formatted_data]
})

# Initialize tokenizer and model with token
tokenizer = T5Tokenizer.from_pretrained(model_name, use_auth_token=hf_api_token)
model = T5ForConditionalGeneration.from_pretrained(model_name, use_auth_token=hf_api_token).to(device)

# Tokenize and format data for training
def preprocess(data):
    inputs = tokenizer(data["input_text"], padding="max_length", truncation=True, max_length=256, return_tensors="pt")
    outputs = tokenizer(data["output_text"], padding="max_length", truncation=True, max_length=256, return_tensors="pt")
    inputs["labels"] = outputs["input_ids"]
    return inputs

tokenized_dataset = dataset.map(preprocess, batched=True)

# Training configurations
training_args = TrainingArguments(
    output_dir="./flan_t5_college_chat_model",
    num_train_epochs=3,  # Increase to enhance model performance
    per_device_train_batch_size=4,
    save_steps=500,
    save_total_limit=1,
    logging_steps=10,
)

# Initialize Trainer for fine-tuning
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset
)

# Start training
trainer.train()

# Save model and tokenizer locally
trainer.save_model("./flan_t5_college_chat_model")
tokenizer.save_pretrained("./flan_t5_college_chat_model")

# Push to Hugging Face Hub
model.push_to_hub("BenyD/FLAN-T5-Small-College-Chat", use_auth_token=hf_api_token)
tokenizer.push_to_hub("BenyD/FLAN-T5-Small-College-Chat", use_auth_token=hf_api_token)

logger.info("Model and tokenizer have been uploaded to Hugging Face.")
