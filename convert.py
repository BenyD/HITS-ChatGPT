import json

with open("training_data.json", "r") as f:
    data = json.load(f)

with open("formatted_training_data.txt", "w") as f:
    for entry in data:
        question = entry["question"]
        context = entry["context"]
        answer = entry["answers"]["text"][0]
        f.write(f"Question: {question}\nContext: {context}\nAnswer: {answer}\n\n")
