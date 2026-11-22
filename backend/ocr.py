import io
import os
import pytesseract
from PIL import Image

import os
if os.name == "nt":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Language pack configuration (currently set to English)
LANGS = "eng"

def read_image(data: bytes) -> tuple[str, float]:
    """Return (text, average word confidence 0-100)."""
    img = Image.open(io.BytesIO(data)).convert("L")
    d = pytesseract.image_to_data(img, lang=LANGS, output_type=pytesseract.Output.DICT)
    words = [(w, float(c)) for w, c in zip(d["text"], d["conf"]) if w.strip() and float(c) >= 0]
    text = " ".join(w for w, _ in words)
    conf = sum(c for _, c in words) / len(words) if words else 0.0
    return text, round(conf, 1)
