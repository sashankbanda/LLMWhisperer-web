import os
import json
from datetime import datetime
from unstract.llmwhisperer import LLMWhispererClientV2
from dotenv import load_dotenv

load_dotenv()

client = LLMWhispererClientV2(
    base_url="https://llmwhisperer-api.us-central.unstract.com/api/v2",
    api_key=os.getenv("LLMWHISPERER_API_KEY")
)

# Ensure output directory exists
OUTPUT_DIR = "app/outputfiles"
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def process_document(file):
    path = f"app/inputfiles/{file.filename}"
    with open(path, "wb") as f:
        f.write(await file.read())

    result = client.whisper(
        file_path=path,
        wait_for_completion=True,
        wait_timeout=300,
        add_line_nos=True,
        output_mode="layout_preserving",
    )

    extraction = result.get("extraction", {})
    text = extraction.get("result_text", "")
    whisper_hash = result.get("whisper_hash")

    # request highlights
    try:
        highlight = client.get_highlight_data(
            whisper_hash=whisper_hash,
            lines="all"
        )
    except:
        highlight = {}

    # Save outputs to outputfiles directory
    base_filename = os.path.splitext(file.filename)[0]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_base = f"{OUTPUT_DIR}/{base_filename}_{timestamp}"

    # Save extracted text
    text_output_path = f"{output_base}_extracted.txt"
    with open(text_output_path, "w", encoding="utf-8") as f:
        f.write(text)

    # Save full result as JSON (includes highlights and metadata)
    json_output_path = f"{output_base}_result.json"
    output_data = {
        "filename": file.filename,
        "whisper_hash": whisper_hash,
        "text": text,
        "highlights": highlight,
        "processed_at": timestamp,
    }
    with open(json_output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    return {
        "text": text,
        "highlights": highlight,
        "whisper_hash": whisper_hash,
    }
