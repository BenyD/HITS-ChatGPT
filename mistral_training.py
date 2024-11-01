import os
import torch  # Add torch for device management
from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
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

# Load and format data
formatted_data = []
with open('formatted_training_data.txt', 'r') as f:
    entry = {}
    for line in f:
        line = line.strip()
        if line.startswith("Question:"):
            entry['input_text'] = line
        elif line.startswith("Context:"):
            entry['input_text'] += f"\n{line}"
        elif line.startswith("Answer:"):
            entry['output_text'] = line.replace("Answer:", "").strip()
            formatted_data.append(entry)
            entry = {}

logger.info(f"Loaded {len(formatted_data)} entries from training data.")

# Create the dataset
dataset = Dataset.from_dict({
    "input_text": [item["input_text"] for item in formatted_data],
    "output_text": [item["output_text"] for item in formatted_data]
})

# Initialize tokenizer and model
tokenizer = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1")
model = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1").to(device)  # Move model to device
tokenizer.pad_token = tokenizer.eos_token

# Tokenize and format data for training
def preprocess(data):
    inputs = tokenizer(data["input_text"], padding="max_length", truncation=True, max_length=256)
    inputs["labels"] = tokenizer(data["output_text"], padding="max_length", truncation=True, max_length=256)["input_ids"]
    return inputs

tokenized_dataset = dataset.map(preprocess, batched=True)

# Training configurations
training_args = TrainingArguments(
    output_dir="./mistral_college_chat_model",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    save_steps=500,
    save_total_limit=2,
    load_best_model_at_end=False,
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
trainer.save_model("./mistral_college_chat_model")
tokenizer.save_pretrained("./mistral_college_chat_model")

# Push to Hugging Face Hub
model.push_to_hub("BenyD/Mistral-College-Chat")
tokenizer.push_to_hub("BenyD/Mistral-College-Chat")

logger.info("Model and tokenizer have been uploaded to Hugging Face.")
