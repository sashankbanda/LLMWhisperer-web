import os
import json
from unstract.llmwhisperer import LLMWhispererClientV2
from dotenv import load_dotenv

load_dotenv()

client = LLMWhispererClientV2(
    base_url="https://llmwhisperer-api.us-central.unstract.com/api/v2",
    api_key=os.getenv("LLMWHISPERER_API_KEY")
)

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

    return {
        "text": text,
        "highlights": highlight,
        "whisper_hash": whisper_hash,
    }
