const fs=require('fs');
let s=fs.readFileSync('scripts/generate_data.js','utf8');
s=s.replace('["aster-everyday-canvas", "Aster Everyday Canvas", "Aster", "unisex", "sneakers", 2299, 2999,','["aster-everyday-canvas", "Aster Everyday Canvas", "Aster", "unisex", "sneakers", 2299, 3499,');
s=s.replace('["rove-metro-low", "Rove Metro Low", "Rove", "men", "sneakers", 4999, 6499,','["rove-metro-low", "Rove Metro Low", "Rove", "men", "sneakers", 4999, 7499,');
s=s.replace('["halo-sand-slide", "Halo Sand Slide", "Halo", "unisex", "sandals", 1499, 1999,','["halo-sand-slide", "Halo Sand Slide", "Halo", "unisex", "sandals", 1499, 2499,');
s=s.replace('["aster-slip-on", "Aster Slip-On", "Aster", "women", "casual", 2799, 3499,','["aster-slip-on", "Aster Slip-On", "Aster", "women", "casual", 2799, 3999,');
s=s.replace('["bramble-play-sneaker": [["little-feet", 1999], ["sole-theory", 2099]]','["bramble-play-sneaker": [["sneaker-house", 1999], ["sole-theory", 2099]]');
fs.writeFileSync('scripts/generate_data.js',s);
