import json

# Open the input text file and output JSON file
with open('formatted_training_data.txt', 'r') as file, open('dataset.json', 'w') as json_file:
    entry = {}
    for line in file:
        line = line.strip()
        if line.startswith("Question:"):
            entry['question'] = line.replace("Question:", "").strip()
        elif line.startswith("Context:"):
            entry['context'] = line.replace("Context:", "").strip()
        elif line.startswith("Answer:"):
            entry['answer'] = line.replace("Answer:", "").strip()
            # Write the entry as a JSON line to the output file
            json_file.write(json.dumps(entry) + "\n")
            entry = {}  # Reset for the next entry
