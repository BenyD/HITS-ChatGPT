from transformers import GPT2LMHeadModel, GPT2Tokenizer, Trainer, TrainingArguments
from datasets import Dataset
import json

# Load your data
with open('training_data.json') as f:
    data = json.load(f)

# Prepare training data
# Format each entry for conversational training by combining question and context
formatted_data = []
for entry in data:
    question = entry["question"]
    context = entry["context"]
    formatted_data.append({
        "input_text": f"Question: {question}\nAnswer:",
        "output_text": context
    })

# Convert to Dataset
dataset = Dataset.from_dict({
    "input_text": [item["input_text"] for item in formatted_data],
    "output_text": [item["output_text"] for item in formatted_data]
})

# Initialize tokenizer and model
tokenizer = GPT2Tokenizer.from_pretrained("gpt2")
model = GPT2LMHeadModel.from_pretrained("gpt2")
tokenizer.pad_token = tokenizer.eos_token  # Set the padding token

# Tokenize the data
def preprocess(data):
    return tokenizer(data["input_text"], padding="max_length", truncation=True, max_length=128)

tokenized_dataset = dataset.map(preprocess, batched=True)

# Training arguments
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    save_steps=500,
    save_total_limit=2,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
)

# Train and save the model
trainer.train()
trainer.save_model("./my_college_chat_model")
model.push_to_hub("BenyD/College-ChatGPT")
