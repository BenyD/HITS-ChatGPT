import os
import torch
from transformers import LlamaForCausalLM, LlamaTokenizer, Trainer, TrainingArguments
from datasets import Dataset
from huggingface_hub import login
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set device to GPU if available, otherwise use CPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# Authenticate with Hugging Face
hf_api_token = os.getenv("HF_API_TOKEN")
if not hf_api_token:
    raise ValueError("Please set the HF_API_TOKEN environment variable")

login(token=hf_api_token)

# Define model and dataset
model_name = "meta-llama/Llama-2-7b-hf"  # Adjust to a smaller variant if possible

# Load data from JSONL format
formatted_data = []
with open('dataset.json', 'r') as f:
    for line in f:
        formatted_data.append(eval(line.strip()))

logger.info(f"Loaded {len(formatted_data)} entries from training data.")

# Create the dataset for Hugging Face format
dataset = Dataset.from_dict({
    "input_text": [item["question"] + "\n" + item["context"] for item in formatted_data],
    "output_text": [item["answer"] for item in formatted_data]
})

# Load tokenizer and model, add token for private repos if needed
tokenizer = LlamaTokenizer.from_pretrained(model_name, token=hf_api_token)
model = LlamaForCausalLM.from_pretrained(model_name, token=hf_api_token).to(device)
tokenizer.pad_token = tokenizer.eos_token

# Tokenize the dataset with reduced sequence length for speed
def preprocess(data):
    inputs = tokenizer(data["input_text"], padding="max_length", truncation=True, max_length=128)  # Reduce max length
    inputs["labels"] = tokenizer(data["output_text"], padding="max_length", truncation=True, max_length=128)["input_ids"]
    return inputs

tokenized_dataset = dataset.map(preprocess, batched=True)

# Training configurations with reduced parameters for faster training
training_args = TrainingArguments(
    output_dir="./llama_college_chat_model",
    num_train_epochs=1,  # Only one epoch for quick training
    per_device_train_batch_size=1,  # Smaller batch size
    save_steps=100,  # Save frequently to prevent loss in case of interruption
    save_total_limit=1,  # Only keep the most recent checkpoint
    load_best_model_at_end=False,
    logging_steps=10,  # Log every 10 steps
)

# Initialize Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset
)

# Start training
trainer.train()

# Save model and tokenizer locally
trainer.save_model("./llama_college_chat_model")
tokenizer.save_pretrained("./llama_college_chat_model")

# Push model and tokenizer to Hugging Face Hub
model.push_to_hub("BenyD/Llama-College-Chat", token=hf_api_token)
tokenizer.push_to_hub("BenyD/Llama-College-Chat", token=hf_api_token)

logger.info("Model and tokenizer have been uploaded to Hugging Face.")
