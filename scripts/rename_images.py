import os
import glob
import json
import shutil

MAP = {
    "raw-00": "red-racer", "raw-01": "amber-court", "raw-02": "coral-runner",
    "raw-03": "mono-court", "raw-04": "pastel-drift", "raw-05": "court-heritage",
    "raw-06": "suspended-trio", "raw-07": "obsidian-knit", "raw-08": "sunburst-street",
    "raw-09": "blush-runner", "raw-10": "burgundy-low", "raw-11": "wall-of-soles",
    "raw-12": "olive-suede", "raw-13": "volt-speed", "raw-14": "cream-heritage",
    "raw-15": "olive-trail", "raw-16": "ivory-pump", "raw-17": "scarlet-hi",
    "raw-18": "grey-sock", "raw-19": "white-azure", "raw-20": "triple-white",
    "raw-21": "tan-desert-boot", "raw-22": "cerulean-heel", "raw-25": "ivory-still-life",
    "raw-26": "teal-classic", "raw-27": "black-chelsea", "raw-29": "mono-low",
    "raw-30": "trail-lace", "raw-31": "oxblood-platform", "raw-32": "sand-slide",
    "raw-34": "espresso-derby", "raw-35": "cognac-loafer", "raw-37": "volt-court-hi",
    "raw-39": "oxblood-oxford", "raw-40": "white-court-pair", "raw-41": "black-runner",
    "raw-43": "amber-runner", "raw-46": "copper-court", "raw-48": "bone-hi-top",
    "raw-50": "chalk-knit", "raw-52": "cream-court-ledge", "raw-53": "steel-street",
    "raw-54": "cobalt-runner", "raw-56": "aqua-platform", "raw-57": "olive-runner",
    "raw-63": "ghost-runner",
}
DIR = "assets/images/shoes"
credits = {}
for raw, name in MAP.items():
    src = os.path.join(DIR, raw + ".jpg")
    if os.path.exists(src):
        shutil.copyfile(src, os.path.join(DIR, name + ".jpg"))
for f in glob.glob(os.path.join(DIR, "raw-*.jpg")):
    os.remove(f)
test = os.path.join(DIR, "_test.jpg")
if os.path.exists(test):
    os.remove(test)

# Save provenance for CREDITS
report = json.load(open("scripts/download-report.json"))
for r in report:
    if r["ok"] and "/shoes/" in r["file"]:
        raw = os.path.splitext(os.path.basename(r["file"]))[0]
        if raw in MAP:
            credits[MAP[raw] + ".jpg"] = "https://unsplash.com/photos/" + r["id"]
json.dump(credits, open("scripts/shoe-credits.json", "w"), indent=2)
print("renamed", len(MAP), "shoe images")
print("jpg total MB", round(sum(os.path.getsize(f) for f in glob.glob(DIR + "/*.jpg")) / 1e6, 2))
