from transformers import DistilBertForQuestionAnswering, Trainer, TrainingArguments
from transformers import DistilBertTokenizerFast
from datasets import Dataset
import json

# Load your data
with open('training_data.json') as f:
    data = json.load(f)

# Filter data to ensure all entries contain required fields
filtered_data = []
for d in data:
    if (
        "question" in d and "context" in d and "answers" in d and
        isinstance(d["answers"], dict) and 
        "text" in d["answers"] and "answer_start" in d["answers"] and
        len(d["answers"]["text"]) > 0 and len(d["answers"]["answer_start"]) > 0
    ):
        filtered_data.append(d)

# Convert your data to a Dataset format compatible with Hugging Face
dataset = Dataset.from_dict({
    "question": [d["question"] for d in filtered_data],
    "context": [d["context"] for d in filtered_data],
    "answers": [{"text": a["answers"]["text"], "answer_start": a["answers"]["answer_start"]} for a in filtered_data]
})

# Initialize the tokenizer and model
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")
model = DistilBertForQuestionAnswering.from_pretrained("distilbert-base-uncased")

# Tokenize the data
def preprocess(examples):
    questions = [q.lstrip() for q in examples["question"]]
    inputs = tokenizer(
        questions,
        examples["context"],
        truncation="only_second",
        max_length=384,
        stride=128,
        return_overflowing_tokens=True,
        return_offsets_mapping=True,
        padding="max_length",
    )

    sample_mapping = inputs.pop("overflow_to_sample_mapping")
    offset_mapping = inputs.pop("offset_mapping")

    # Label the start and end positions
    answers = examples["answers"]
    start_positions = []
    end_positions = []

    for i, offsets in enumerate(offset_mapping):
        input_ids = inputs["input_ids"][i]
        cls_index = input_ids.index(tokenizer.cls_token_id)

        sequence_ids = inputs.sequence_ids(i)
        sample_index = sample_mapping[i]
        answer = answers[sample_index]
        start_char = answer["answer_start"][0]
        end_char = start_char + len(answer["text"][0])

        token_start_index = 0
        while sequence_ids[token_start_index] != 1:
            token_start_index += 1

        token_end_index = len(input_ids) - 1
        while sequence_ids[token_end_index] != 1:
            token_end_index -= 1

        if offsets[token_start_index][0] <= start_char and offsets[token_end_index][1] >= end_char:
            start_positions.append(token_start_index)
            end_positions.append(token_end_index)
        else:
            start_positions.append(cls_index)
            end_positions.append(cls_index)

    inputs["start_positions"] = start_positions
    inputs["end_positions"] = end_positions
    return inputs

# Apply preprocessing
tokenized_dataset = dataset.map(preprocess, batched=True, remove_columns=dataset.column_names)

# Set up training
training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    eval_dataset=tokenized_dataset,
)

# Train the model
trainer.train()

# Save the model locally and to Hugging Face
trainer.save_model("./my_model")
model.push_to_hub("BenyD/University-QA-Bot")
