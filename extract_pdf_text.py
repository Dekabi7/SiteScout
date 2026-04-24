import PyPDF2

# List of PDF files to extract from
pdf_files = [
    ("SiteScout EP.pdf", "SiteScout_EP.txt"),
    ("SiteScout PRD.pdf", "SiteScout_PRD.txt")
]

def extract_text_from_pdf(pdf_path, txt_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        with open(txt_path, 'w', encoding='utf-8') as out:
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    out.write(text + '\n')

if __name__ == "__main__":
    for pdf_path, txt_path in pdf_files:
        print(f"Extracting {pdf_path} to {txt_path}...")
        extract_text_from_pdf(pdf_path, txt_path)
    print("Extraction complete.") 