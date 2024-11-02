import json

# Input and output file names
input_file = "formatted_training_data.txt"
output_file = "dataset.json"

# Open the input and output files
with open(input_file, "r") as infile, open(output_file, "w") as outfile:
    lines = infile.readlines()
    
    for i in range(0, len(lines), 4):
        if i + 2 < len(lines):  # Ensure there are enough lines for each entry
            question_line = lines[i].strip().replace("Question: ", "")
            context_line = lines[i + 1].strip().replace("Context: ", "")
            answer_line = lines[i + 2].strip().replace("Answer: ", "")

            # Format the question and answer, including context if needed
            entry = {
                "question": question_line,
                "answer": answer_line,
                "context": context_line
            }

            # Write to the output file in JSONL format
            json.dump(entry, outfile)
            outfile.write("\n")

print(f"Dataset successfully converted to {output_file}")
