import fitz  # PyMuPDF
import json

# Load PDF file
pdf_file = "University_Handbook_2023.pdf"  # Replace with the actual filename of your PDF
output_data = {}

with fitz.open(pdf_file) as pdf:
    for page_num in range(len(pdf)):
        page = pdf[page_num]
        text = page.get_text("text")
        # Add the text to the dictionary, using page number as the key
        output_data[f"Page_{page_num + 1}"] = text

# Save output to a JSON file
with open("handbook_data.json", "w") as json_file:
    json.dump(output_data, json_file, indent=4)

print("PDF text extraction complete! Data saved to handbook_data.json")
