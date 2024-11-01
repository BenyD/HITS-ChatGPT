from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer, TrainingArguments
from datasets import Dataset
import os
from huggingface_hub import login
import logging

# Set up logging for better monitoring in production
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Authenticate with Hugging Face
hf_token = os.getenv("HF_API_TOKEN")
if not hf_token:
    logger.error("Hugging Face API token is missing. Set it in environment variables.")
    raise ValueError("Hugging Face API token not found.")
else:
    login(token=hf_token)

# Load and format data from the pre-formatted text file
formatted_data = []
try:
    with open('formatted_training_data.txt', 'r') as f:
        entry = {}
        for line in f:
            line = line.strip()
            if line.startswith("Question:"):
                entry['input_text'] = line
            elif line.startswith("Context:"):
                entry['input_text'] += f"\n{line}"
            elif line.startswith("Answer:"):
                entry['output_text'] = line.replace("Answer:", "").strip()  # Remove "Answer:" prefix
                # Add entry only if both input_text and output_text are populated
                if 'input_text' in entry and 'output_text' in entry:
                    formatted_data.append(entry)
                entry = {}  # Reset entry for the next data block
except FileNotFoundError:
    logger.error("The formatted_training_data.txt file was not found.")
    raise
except Exception as e:
    logger.error(f"An error occurred while loading data: {e}")
    raise

# Verify if data is loaded correctly
if not formatted_data:
    logger.error("No valid data found in formatted_training_data.txt.")
    raise ValueError("Training data is empty or incorrectly formatted.")
else:
    logger.info(f"Loaded {len(formatted_data)} entries from training data.")

# Convert to Dataset
dataset = Dataset.from_dict({
    "input_text": [item["input_text"] for item in formatted_data],
    "output_text": [item["output_text"] for item in formatted_data]
})

# Initialize tokenizer and model
try:
    tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
    model = GPT2LMHeadModel.from_pretrained("gpt2")
    tokenizer.pad_token = tokenizer.eos_token  # Set the padding token
    logger.info("Model and tokenizer initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing model or tokenizer: {e}")
    raise

# Tokenize the data with labels
def preprocess(data):
    inputs = tokenizer(data["input_text"], padding="max_length", truncation=True, max_length=256)
    inputs["labels"] = tokenizer(data["output_text"], padding="max_length", truncation=True, max_length=256)["input_ids"]
    return inputs

tokenized_dataset = dataset.map(preprocess, batched=True)

# Define production-grade training arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=5,
    per_device_train_batch_size=8,
    save_strategy="epoch",  # Keep the save strategy to "epoch"
    evaluation_strategy="no",  # Set evaluation strategy to "no" if you have no eval dataset
    logging_dir='./logs',
    logging_steps=100,
    load_best_model_at_end=False,  # Disable this option
    save_total_limit=3,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
)

# Training with enhanced error handling
try:
    logger.info("Starting model fine-tuning...")
    trainer.train()
    logger.info("Model fine-tuning completed.")
    
    # Save model and tokenizer locally
    model.save_pretrained("./my_college_chat_model")
    tokenizer.save_pretrained("./my_college_chat_model")
    logger.info("Model and tokenizer saved locally.")

    # Upload model to Hugging Face Hub
    model.push_to_hub("BenyD/College-ChatGPT")
    tokenizer.push_to_hub("BenyD/College-ChatGPT")
    logger.info("Model and tokenizer uploaded to Hugging Face Hub.")
except Exception as e:
    logger.error(f"Error during training or saving: {e}")
    raise

logger.info("Fine-tuning script completed successfully.")
