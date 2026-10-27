"""One-off asset fetcher: downloads free-to-use Unsplash photos and normalises size."""
import concurrent.futures as cf
import io
import json
import os
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOE_DIR = os.path.join(ROOT, "assets", "images", "shoes")
OTHER_DIR = os.path.join(ROOT, "assets", "images")

SHOE_IDS = [
    "1542291026-7eec264c27ff", "1549298916-b41d501d3772", "1600185365483-26d7a4cc7519",
    "1608231387042-66d1773070a5", "1595950653106-6c9ebd614d3a", "1552346154-21d32810aba3",
    "1560769629-975ec94e6a86", "1491553895911-0055eca6402d", "1514989940723-e8e51635b782",
    "1551107696-a4b0c5a0d9a2", "1525966222134-fcfa99b8ae77", "1495555961986-6d4c1ecb7be3",
    "1539185441755-769473a23570", "1606107557195-0e29a4b5b4aa", "1584735175315-9d5df23860e6",
    "1582588678413-dbf45f4823e9", "1518049362265-d5b2a6467637", "1575537302964-96cd47c06b1b",
    "1562183241-b937e95585b6", "1595341888016-a392ef81b7de", "1460353581641-37baddab0fa2",
    "1520639888713-7851133b1ed0", "1543163521-1bf539c55dd2", "1596704017254-9b121068fb31",
    "1614252369475-531eba835eb1", "1519415943484-9fa1873496d4", "1560343090-f0409e92791a",
    "1608256246200-53e635b5b65f", "1520219306100-ec69e9c6b3a4", "1543508282-6319a3e2621f",
    "1531310197839-ccf54634509e", "1562273138-f46be4ebdf33", "1603487742131-4160ec999306",
    "1519415510236-718bdfcd89c8", "1533867617858-e7b97e060509", "1590099033615-be195f8d575c",
    "1588374809531-5d1e3d3f0772", "1597248881519-db089d3744a5", "1509942774463-acf339cf87d5",
    "1512675828443-4f454c42253a", "1600269452121-4f2416e55c28", "1605348532760-6753d2c43329",
    "1599407384293-05b7b8b0f0c0", "1533681904393-9ab6eee7e408", "1554139844-af2fc8d1d0e7",
    "1561864758-7d0a5d6a7b0d", "1549298916-b41d501d3772", "1596413746553-6f22c6c4c8b1",
    "1603808033192-082d6919d3e1", "1608373135546-0d8a7d0d8b9d", "1551489186-cf8726f514f8",
    "1590823663948-7a0a4f0b6d0f", "1584735175315-9d5df23860e6", "1556906781-9a412961c28c",
    "1515955656352-a1fa3ffcd111", "1517836357463-d25dfeac3438", "1520256862855-398228c41684",
    "1539185441755-769473a23570", "1552346154-21d32810aba3", "1542291026-7eec264c27ff",
    "1618354691373-d851c5c3a990", "1567013127542-490d757e51fc", "1544967082-d9d25d867d66",
    "1592921870789-04563d55041c", "1529810313688-44ea1c2d81d3", "1520000000000-000000000000",
]

OTHER_SETS = {
    "shops/store-1.jpg": "1441986300917-64674bd600d8",
    "shops/store-2.jpg": "1555529669-e69e7aa0ba9a",
    "shops/store-3.jpg": "1528698827591-e19ccd7bc23d",
    "shops/store-4.jpg": "1441984904996-e0b6ba687e04",
    "shops/store-5.jpg": "1567401893414-76b7b1e5a7a5",
    "shops/store-6.jpg": "1472851294608-062f824d29cc",
    "banners/hero-1.jpg": "1556906781-9a412961c28c",
    "banners/hero-2.jpg": "1460353581641-37baddab0fa2",
    "banners/hero-3.jpg": "1491553895911-0055eca6402d",
    "banners/promo-1.jpg": "1600185365483-26d7a4cc7519",
    "avatars/avatar-1.jpg": "1494790108377-be9c29b29330",
    "avatars/avatar-2.jpg": "1500648767791-00dcc994a43e",
    "avatars/avatar-3.jpg": "1534528741775-53994a69daeb",
    "avatars/avatar-4.jpg": "1506794778202-cad84cf45f1d",
    "banners/craft.jpg": "1515955656352-a1fa3ffcd111",
}


def fetch(photo_id, out_path, width):
    url = f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={width}&q=78"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (LocalSole asset fetch)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = r.read()
            if len(data) < 12000:
                raise ValueError("too small")
            im = Image.open(io.BytesIO(data)).convert("RGB")
            im.thumbnail((width, width), Image.LANCZOS)
            im.save(out_path, "JPEG", quality=80, optimize=True, progressive=True)
            return {"id": photo_id, "file": os.path.relpath(out_path, ROOT).replace("\\", "/"), "ok": True}
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                return {"id": photo_id, "file": out_path, "ok": False, "error": str(e)}
    return None


def main():
    os.makedirs(SHOE_DIR, exist_ok=True)
    tasks = []
    for i, pid in enumerate(SHOE_IDS):
        tasks.append((pid, os.path.join(SHOE_DIR, f"raw-{i:02d}.jpg"), 900))
    for rel, pid in OTHER_SETS.items():
        path = os.path.join(OTHER_DIR, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        tasks.append((pid, path, 1400 if rel.startswith("banners") else 900))
    results = []
    with cf.ThreadPoolExecutor(max_workers=10) as ex:
        futs = {ex.submit(fetch, *t): t for t in tasks}
        for f in cf.as_completed(futs):
            results.append(f.result())
    ok = [r for r in results if r["ok"]]
    bad = [r for r in results if not r["ok"]]
    print(f"downloaded {len(ok)}/{len(results)}")
    for r in bad:
        print("FAILED", r.get("file"), r.get("id"), r.get("error"))
    with open(os.path.join(ROOT, "scripts", "download-report.json"), "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2)

    # contact sheet of successfully downloaded shoe photos
    shoes = sorted([r for r in ok if "/shoes/" in r["file"]], key=lambda r: r["file"])
    if shoes:
        cols, size, label_h = 8, 220, 28
        rows = (len(shoes) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * size, rows * (size + label_h)), "#f2f0eb")
        draw = ImageDraw.Draw(sheet)
        try:
            font = ImageFont.truetype("arial.ttf", 15)
        except OSError:
            font = ImageFont.load_default()
        for i, r in enumerate(shoes):
            im = Image.open(os.path.join(ROOT, r["file"]))
            im.thumbnail((size - 10, size - 10))
            x, y = (i % cols) * size, (i // cols) * (size + label_h)
            sheet.paste(im, (x + (size - im.width) // 2, y + (size - im.height) // 2))
            draw.text((x + 6, y + size + 4), os.path.basename(r["file"]), fill="#171717", font=font)
        sheet.save(os.path.join(ROOT, "scripts", "shoe-contact-sheet.jpg"), quality=82)
        print("sheet:", len(shoes), "tiles")


if __name__ == "__main__":
    main()
