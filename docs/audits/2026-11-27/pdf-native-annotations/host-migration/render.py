from pathlib import Path
import os, subprocess, json
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parent
RENDER = ROOT / "render"
RENDER.mkdir(exist_ok=True)
BINARY = "/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/bin/pdftoppm"
environment = dict(os.environ)
environment["FONTCONFIG_FILE"] = str(ROOT / "fontconfig.conf")
plan = [("original",1),("legacy-migrated",1),("native-twelve-types",1),("native-twelve-types",2),
        ("copy-edited",1),("copy-edited",3),("merged-round-1",1),("merged-round-1",5),("merged-round-2",1),("merged-round-2",5)]
files = []
for label, page in plan:
    prefix = RENDER / (label + "-page-" + str(page))
    process = subprocess.run([BINARY,"-r","144","-f",str(page),"-l",str(page),"-singlefile","-png",str(ROOT/(label+".pdf")),str(prefix)],
        env=environment,capture_output=True,text=True,timeout=45,check=True)
    if process.stderr: raise RuntimeError(process.stderr)
    files.append({"file":label+".pdf","page":page,"png":str(prefix)+".png"})
    print("rendered",label,page,flush=True)
sheet = Image.new("RGB",(1350,2880),"white")
draw = ImageDraw.Draw(sheet)
for index,item in enumerate(files):
    image = Image.open(item["png"]).convert("RGB")
    image.thumbnail((430,680))
    x,y=index%3*450,index//3*720
    draw.text((x+8,y+6),item["file"]+" p"+str(item["page"]),fill="black")
    sheet.paste(image,(x+8,y+28))
sheet.save(RENDER/"contact-sheet.png")
(ROOT/"poppler.json").write_text(json.dumps({"status":"rendered-awaiting-visual","files":files},indent=2))
