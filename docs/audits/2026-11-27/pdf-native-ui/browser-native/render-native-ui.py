from pathlib import Path
import json
import os
import subprocess
from PIL import Image, ImageDraw
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "render"
OUTPUT.mkdir(exist_ok=True)
POPPLER = "/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/bin/pdftoppm"
PREFIXES = ["p012-freetext", "p014-markers", "p016-geometry", "gesture-history",
            "p015-discussion", "legacy-migration", "nonempty-recipe", "explicit-none"]
environment = dict(os.environ)
environment["FONTCONFIG_FILE"] = str(ROOT / "fontconfig.conf")
records = []
for prefix in PREFIXES:
    for round_number in [1, 2]:
        path = ROOT / f"{prefix}-round-{round_number}.pdf"
        pages = list(range(1, len(PdfReader(path).pages) + 1)) if prefix == "nonempty-recipe" else [1]
        for page in pages:
            output = OUTPUT / (path.stem + f"-page-{page}")
            result = subprocess.run([POPPLER, "-r", "144", "-f", str(page), "-l", str(page),
                                     "-singlefile", "-png", str(path), str(output)],
                                    capture_output=True, env=environment, text=True, timeout=60, check=True)
            if result.stderr:
                raise RuntimeError(result.stderr)
            records.append({"pdf": path.name, "page": page, "png": str(output) + ".png"})
            print("rendered actual UI export", path.name, page, flush=True)
width, height = 1500, ((len(records) + 2) // 3) * 720
sheet = Image.new("RGB", (width, height), "white")
draw = ImageDraw.Draw(sheet)
for index, record in enumerate(records):
    image = Image.open(record["png"]).convert("RGB")
    image.thumbnail((480, 680))
    x, y = index % 3 * 500, index // 3 * 720
    draw.text((x + 8, y + 6), record["pdf"] + " p" + str(record["page"]), fill="black")
    sheet.paste(image, (x + 8, y + 28))
sheet.save(OUTPUT / "contact-sheet.png")
(ROOT / "poppler.json").write_text(json.dumps({"status": "rendered-awaiting-visual", "pages": records}, indent=2))
