import json

# Load both JSON files
with open("handbook_data.json") as file1, open("handbook.json") as file2:
    data1 = json.load(file1)
    data2 = json.load(file2)

# Define some sample questions based on the content structure
questions = [
    {
        "question": "Where is the Meditation and Counseling Centre located?",
        "key": "Page_2"
    },
    {
        "question": "What is the full name of the institution?",
        "key": "handbook.institution_info.name.full_name"
    },
    {
        "question": "Who founded the institution?",
        "key": "Page_3"
    },
    {
        "question": "What are the former names of the institution?",
        "key": "handbook.institution_info.name.former_names"
    }
]

# Helper function to retrieve nested data
def get_nested(data, key):
    keys = key.split(".")
    for k in keys:
        if isinstance(data, list):
            # If data is a list, iterate over items and apply the key
            data = [item.get(k, {}) if isinstance(item, dict) else item for item in data]
            # If we still have a list after fetching, join text from list elements
            if all(isinstance(d, str) for d in data):
                data = "; ".join(data)
            else:
                # Flatten and combine items into a single string if needed
                data = " ".join(str(d) for d in data if d)
        elif isinstance(data, dict):
            data = data.get(k, {})
        else:
            return None  # In case of unexpected structure
    return data if isinstance(data, str) else None

# Prepare the QA dataset
training_data = []

for question_item in questions:
    question = question_item["question"]
    context = get_nested(data1, question_item["key"]) or get_nested(data2, question_item["key"])
    if context:
        training_data.append({
            "question": question,
            "context": context,
            "answers": {
                "text": [context], 
                "answer_start": [0]  # Start at 0 since the entire context answers the question
            }
        })

# Save the processed dataset
with open("training_data.json", "w") as outfile:
    json.dump(training_data, outfile, indent=4)

print("Preprocessed data saved to 'training_data.json'")
