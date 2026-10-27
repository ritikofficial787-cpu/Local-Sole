/* Generates the demo catalogue + shops. Run: node scripts/generate_data.js */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const img = (n) => `assets/images/shoes/${n}.jpg`;

const shops = [
  {
    id: "sole-theory", name: "Sole Theory", shortName: "Sole Theory",
    tagline: "Sneakers with a point of view",
    area: "Indiranagar", city: "Bengaluru", address: "12, 100 Feet Road, Indiranagar",
    pincode: "560038", phone: "+91 80 4123 8890", email: "hello@soletehory.in",
    rating: 4.8, reviewCount: 412, since: 2014, lat: 12.9719, lng: 77.6412,
    logo: "assets/images/icons/logo-sole-theory.svg", accent: "#E8452C",
    banner: "assets/images/shops/store-3.jpg",
    gallery: ["assets/images/shops/store-3.jpg", "assets/images/shoes/wall-of-soles.jpg", "assets/images/shops/store-1.jpg"],
    description: "A neighbourhood sneaker room on 100 Feet Road. We keep a tight edit of independent labels, archive-inspired silhouettes and everyday runners — plus a repair desk for the pairs you already love.",
    specialties: ["Sneakers", "Everyday runners", "Sneaker care"],
    hours: { mon: ["10:30", "21:00"], tue: ["10:30", "21:00"], wed: ["10:30", "21:00"], thu: ["10:30", "21:00"], fri: ["10:30", "21:00"], sat: ["10:30", "21:00"], sun: ["11:00", "20:00"] },
    delivery: { available: true, eta: "Same day", fee: 79, freeOver: 2499 },
    pickup: { available: true, discount: 5, readyIn: 45 },
    paymentMethods: ["UPI", "Card", "Cash"], parking: "Street parking on 12th Main", accessibility: true
  },
  {
    id: "sneaker-house", name: "The Sneaker House", shortName: "Sneaker House",
    tagline: "Limited drops, local hands",
    area: "Koramangala", city: "Bengaluru", address: "80 Feet Road, 5th Block, Koramangala",
    pincode: "560095", phone: "+91 80 4110 2245", email: "drops@sneakerhouse.in",
    rating: 4.7, reviewCount: 328, since: 2016, lat: 12.9345, lng: 77.6266,
    logo: "assets/images/icons/logo-sneaker-house.svg", accent: "#141414",
    banner: "assets/images/shops/store-1.jpg",
    gallery: ["assets/images/shops/store-1.jpg", "assets/images/shoes/suspended-trio.jpg", "assets/images/shops/store-6.jpg"],
    description: "Half sneaker store, half community clubhouse. Drop days happen every second Saturday, and our staff will happily talk lacing, insoles and whether that pair really runs true to size.",
    specialties: ["Limited drops", "Streetwear", "Trade-ins"],
    hours: { mon: ["11:00", "22:00"], tue: ["11:00", "22:00"], wed: ["11:00", "22:00"], thu: ["11:00", "22:00"], fri: ["11:00", "22:00"], sat: ["11:00", "22:00"], sun: ["11:00", "22:00"] },
    delivery: { available: true, eta: "1–2 days", fee: 79, freeOver: 2499 },
    pickup: { available: true, discount: 0, readyIn: 30 },
    paymentMethods: ["UPI", "Card"], parking: "Basement parking, 5th Block", accessibility: false
  },
  {
    id: "leather-and-lace", name: "Leather & Lace", shortName: "Leather & Lace",
    tagline: "Occasion shoes, quietly made",
    area: "Jayanagar", city: "Bengaluru", address: "4th Block, 11th Main, Jayanagar",
    pincode: "560011", phone: "+91 80 2663 1180", email: "care@leatherandlace.in",
    rating: 4.6, reviewCount: 189, since: 2011, lat: 12.925, lng: 77.5838,
    logo: "assets/images/icons/logo-leather-and-lace.svg", accent: "#7A4B3A",
    banner: "assets/images/shops/store-4.jpg",
    gallery: ["assets/images/shops/store-4.jpg", "assets/images/shoes/cerulean-heel.jpg", "assets/images/shops/store-2.jpg"],
    description: "Three generations of sizing experience in one calm Jayanagar shop. We specialise in wedding parties, boardrooms and heels you can actually stand in — with free first fitting and adjustments.",
    specialties: ["Formal", "Women's occasion", "Free fitting"],
    hours: { mon: ["10:00", "20:30"], tue: ["10:00", "20:30"], wed: ["10:00", "20:30"], thu: ["10:00", "20:30"], fri: ["10:00", "20:30"], sat: ["10:00", "20:30"], sun: null },
    delivery: { available: true, eta: "2–3 days", fee: 99, freeOver: 3499 },
    pickup: { available: true, discount: 8, readyIn: 60 },
    paymentMethods: ["UPI", "Card", "Cash"], parking: "Dedicated two-wheeler parking", accessibility: true
  },
  {
    id: "stride", name: "stride.", shortName: "stride.",
    tagline: "Run your first kilometre",
    area: "HSR Layout", city: "Bengaluru", address: "27th Main, Sector 1, HSR Layout",
    pincode: "560102", phone: "+91 80 4155 7712", email: "run@stride.in",
    rating: 4.9, reviewCount: 256, since: 2018, lat: 12.9121, lng: 77.6471,
    logo: "assets/images/icons/logo-stride.svg", accent: "#0E7C66",
    banner: "assets/images/shops/store-2.jpg",
    gallery: ["assets/images/shops/store-2.jpg", "assets/images/shoes/red-racer.jpg", "assets/images/shops/store-4.jpg"],
    description: "A run-first store with a gait-analysis treadmill, weekly 5K meet-ups and staff who log real miles. Free gait analysis with every running shoe purchase — appointment recommended.",
    specialties: ["Running", "Gait analysis", "Run club"],
    hours: { mon: ["06:00", "21:00"], tue: ["06:00", "21:00"], wed: ["06:00", "21:00"], thu: ["06:00", "21:00"], fri: ["06:00", "21:00"], sat: ["06:00", "21:00"], sun: ["07:00", "13:00"] },
    delivery: { available: true, eta: "Same day", fee: 49, freeOver: 1999 },
    pickup: { available: true, discount: 0, readyIn: 20 },
    paymentMethods: ["UPI", "Card"], parking: "Free parking for 30 mins", accessibility: true
  },
  {
    id: "footwork-collective", name: "Footwork Collective", shortName: "Footwork",
    tagline: "Eight labels, one room",
    area: "MG Road", city: "Bengaluru", address: "17 Church Street, Ashok Nagar",
    pincode: "560001", phone: "+91 80 4093 6621", email: "studio@footwork.in",
    rating: 4.5, reviewCount: 301, since: 2019, lat: 12.9753, lng: 77.6045,
    logo: "assets/images/icons/logo-footwork.svg", accent: "#3355D8",
    banner: "assets/images/shops/store-6.jpg",
    gallery: ["assets/images/shops/store-6.jpg", "assets/images/shoes/wall-of-soles.jpg", "assets/images/shops/store-5.jpg"],
    description: "A collective of eight small Indian labels sharing a Church Street townhouse. Expect experimental materials, comfortable everyday pairs and a rotating gallery wall from local artists.",
    specialties: ["Independent labels", "Everyday", "Art wall"],
    hours: { mon: ["11:00", "21:30"], tue: ["11:00", "21:30"], wed: ["11:00", "21:30"], thu: ["11:00", "21:30"], fri: ["11:00", "21:30"], sat: ["11:00", "21:30"], sun: ["12:00", "19:00"] },
    delivery: { available: true, eta: "1–2 days", fee: 99, freeOver: 2999 },
    pickup: { available: true, discount: 5, readyIn: 40 },
    paymentMethods: ["UPI", "Card", "Cash"], parking: "Paid parking at Church Street", accessibility: false
  },
  {
    id: "little-feet", name: "Little Feet Co.", shortName: "Little Feet",
    tagline: "Grow-room built in",
    area: "Whitefield", city: "Bengaluru", address: "5th Cross, Palm Meadows, Whitefield",
    pincode: "560066", phone: "+91 80 2845 0901", email: "hello@littlefeet.in",
    rating: 4.8, reviewCount: 167, since: 2017, lat: 12.9698, lng: 77.7499,
    logo: "assets/images/icons/logo-little-feet.svg", accent: "#E0A21A",
    banner: "assets/images/shops/store-5.jpg",
    gallery: ["assets/images/shops/store-5.jpg", "assets/images/shoes/ivory-still-life.jpg", "assets/images/shops/store-1.jpg"],
    description: "Kids' shoes without the guesswork. Every pair has a removable grow-room insole, free width fitting and a 30-day 'they grew' exchange. There is a small play corner, too.",
    specialties: ["Kids", "Free fitting", "Grow-room"],
    hours: { mon: ["10:00", "19:30"], tue: ["10:00", "19:30"], wed: ["10:00", "19:30"], thu: ["10:00", "19:30"], fri: ["10:00", "19:30"], sat: ["10:00", "19:30"], sun: ["11:00", "18:00"] },
    delivery: { available: true, eta: "2–3 days", fee: 69, freeOver: 1999 },
    pickup: { available: true, discount: 10, readyIn: 60 },
    paymentMethods: ["UPI", "Card", "Cash"], parking: "Free family parking", accessibility: true
  },
  {
    id: "urban-trekker", name: "Urban Trekker", shortName: "Urban Trekker",
    tagline: "Tested on the trail",
    area: "Malleshwaram", city: "Bengaluru", address: "8th Cross, Sampige Road, Malleshwaram",
    pincode: "560003", phone: "+91 80 2346 7788", email: "trail@urbantrekker.in",
    rating: 4.4, reviewCount: 144, since: 2012, lat: 13.0031, lng: 77.5709,
    logo: "assets/images/icons/logo-urban-trekker.svg", accent: "#56633B",
    banner: "assets/images/shoes/wall-of-soles.jpg",
    gallery: ["assets/images/shoes/wall-of-soles.jpg", "assets/images/shoes/tan-desert-boot.jpg", "assets/images/shops/store-2.jpg"],
    description: "Boots, trail runners and rain-ready gear from a shop full of maps and well-worn samples. Our staff lead monthly hikes around Nandi Hills — buy a pair, join the walk.",
    specialties: ["Outdoor", "Boots", "Repairs"],
    hours: { mon: null, tue: ["10:30", "20:00"], wed: ["10:30", "20:00"], thu: ["10:30", "20:00"], fri: ["10:30", "20:00"], sat: ["10:30", "20:00"], sun: ["10:30", "20:00"] },
    delivery: { available: true, eta: "2–4 days", fee: 99, freeOver: 3499 },
    pickup: { available: true, discount: 0, readyIn: 45 },
    paymentMethods: ["UPI", "Card"], parking: "Street parking, Sampige Road", accessibility: true
  },
  {
    id: "miller-and-sons", name: "Miller & Sons", shortName: "Miller & Sons",
    tagline: "Since 1962, still hand-stitched",
    area: "Commercial Street", city: "Bengaluru", address: "92 Commercial Street, Tasker Town",
    pincode: "560001", phone: "+91 80 2558 4410", email: "shop@millerandsons.in",
    rating: 4.7, reviewCount: 520, since: 1962, lat: 12.9822, lng: 77.6089,
    logo: "assets/images/icons/logo-miller-and-sons.svg", accent: "#1D3B33",
    banner: "assets/images/shops/store-3.jpg",
    gallery: ["assets/images/shops/store-3.jpg", "assets/images/shoes/espresso-derby.jpg", "assets/images/shoes/wall-of-soles.jpg"],
    description: "A Commercial Street institution since 1962. Four generations of hand-stitched leather, a proper repair workshop at the back and a kettle that is always on. Bring your grandfather's brogues — we'll bring them back.",
    specialties: ["Heritage leather", "Repairs", "Made to order"],
    hours: { mon: ["09:30", "20:30"], tue: ["09:30", "20:30"], wed: ["09:30", "20:30"], thu: ["09:30", "20:30"], fri: ["09:30", "20:30"], sat: ["09:30", "20:30"], sun: ["10:30", "18:00"] },
    delivery: { available: true, eta: "2–3 days", fee: 0, freeOver: 0 },
    pickup: { available: true, discount: 5, readyIn: 30 },
    paymentMethods: ["UPI", "Card", "Cash"], parking: "Commercial Street public parking", accessibility: false
  }
];

const IMG_COLOR = {
  "red-racer": ["Crimson Flash", "#C62828"], "amber-court": ["Amber", "#B7742E"],
  "coral-runner": ["Coral", "#E4674C"], "mono-court": ["Black / White", "#202020"],
  "pastel-drift": ["Pastel Peach", "#E8C3BC"], "court-heritage": ["Court Multi", "#3057A6"],
  "suspended-trio": ["Multi", "#B9AFA3"], "obsidian-knit": ["Obsidian", "#25252B"],
  "sunburst-street": ["Sunburst", "#E39B2B"], "blush-runner": ["Blush", "#C98F8A"],
  "burgundy-low": ["Burgundy", "#6E2535"], "wall-of-soles": ["Multi", "#C9B79F"],
  "olive-suede": ["Olive", "#57604A"], "volt-speed": ["Volt", "#B7E22B"],
  "cream-heritage": ["Cream", "#E2D4B7"], "olive-trail": ["Olive", "#4F5B3D"],
  "ivory-pump": ["Ivory", "#EEE5D6"], "scarlet-hi": ["Scarlet", "#B31F1F"],
  "grey-sock": ["Grey", "#888A8C"], "white-azure": ["White / Azure", "#DDE7EE"],
  "triple-white": ["Triple White", "#F3F3F1"], "tan-desert-boot": ["Tan", "#A97645"],
  "cerulean-heel": ["Cerulean", "#2A6BA8"], "ivory-still-life": ["Ivory", "#E9E4D8"],
  "teal-classic": ["Teal", "#1C7B78"], "black-chelsea": ["Black", "#1B1B1B"],
  "mono-low": ["Mono Black", "#262626"], "trail-lace": ["Tan", "#9B6C44"],
  "oxblood-platform": ["Oxblood", "#5A2026"], "sand-slide": ["Sand", "#C6AD8D"],
  "espresso-derby": ["Espresso", "#3B2A22"], "cognac-loafer": ["Cognac", "#9A5B2C"],
  "volt-court-hi": ["Volt", "#C6D93A"], "oxblood-oxford": ["Oxblood", "#5E2528"],
  "white-court-pair": ["White", "#F0F0EC"], "black-runner": ["Black", "#252525"],
  "amber-runner": ["Amber", "#B0723C"], "copper-court": ["Copper", "#A6623A"],
  "bone-hi-top": ["Bone", "#E7DFD1"], "chalk-knit": ["Chalk", "#E9E7E2"],
  "cream-court-ledge": ["Cream", "#E6DAC4"], "steel-street": ["Steel", "#9EA2A5"],
  "cobalt-runner": ["Cobalt", "#2F5AA8"], "aqua-platform": ["Aqua", "#7FB8BD"],
  "olive-runner": ["Olive", "#59633C"], "ghost-runner": ["Ghost White", "#EFEFED"]
};

const shoePools = {
  running: ["red-racer", "coral-runner", "obsidian-knit", "volt-speed", "olive-trail", "white-azure", "black-runner", "amber-runner", "chalk-knit", "cobalt-runner", "olive-runner"],
  sneakers: ["amber-court", "mono-court", "pastel-drift", "court-heritage", "sunburst-street", "blush-runner", "burgundy-low", "olive-suede", "cream-heritage", "scarlet-hi", "grey-sock", "triple-white", "ivory-still-life", "teal-classic", "mono-low", "volt-court-hi", "white-court-pair", "copper-court", "bone-hi-top", "cream-court-ledge", "steel-street", "aqua-platform", "ghost-runner", "suspended-trio"],
  formal: ["espresso-derby", "cognac-loafer", "oxblood-oxford", "black-chelsea", "ivory-pump", "cerulean-heel", "oxblood-platform"],
  boots: ["tan-desert-boot", "black-chelsea", "trail-lace", "olive-trail"],
  sandals: ["sand-slide", "oxblood-platform", "aqua-platform", "ivory-pump"],
  sports: ["volt-court-hi", "court-heritage", "red-racer", "cobalt-runner", "black-runner", "white-azure", "steel-street"],
  casual: ["teal-classic", "ivory-still-life", "ghost-runner", "cream-heritage", "olive-suede", "burgundy-low", "copper-court", "amber-court", "sand-slide"]
};

const womenPool = ["pastel-drift", "blush-runner", "ivory-still-life", "aqua-platform", "ghost-runner", "teal-classic", "cream-heritage", "ivory-pump", "cerulean-heel", "oxblood-platform"];
const kidsPool = ["scarlet-hi", "bone-hi-top", "aqua-platform", "pastel-drift", "blush-runner", "volt-court-hi", "ghost-runner"];
const menFormalPool = ["espresso-derby", "cognac-loafer", "oxblood-oxford", "black-chelsea"];

const productRows = [
  // [id, name, brand, category, type, price, oldPrice, rating, reviews, shopId, primaryImage override, new, best, material]
  ["nike-pegasus-41", "Air Zoom Pegasus 41", "Nike", "unisex", "running", 8999, 11999, 4.8, 214, "stride", "coral-runner", true, true, "Engineered mesh"],
  ["norr-motion-knit", "Norr Motion Knit", "Norr", "unisex", "running", 6499, null, 4.6, 98, "sole-theory", "olive-runner", false, false, "Recycled knit"],
  ["nike-vaporfly-3", "Vaporfly 3", "Nike", "men", "running", 16999, 19999, 4.9, 156, "stride", "cobalt-runner", false, true, "Carbon-plate mesh"],
  ["aeris-stratus-lite", "Aeris Stratus Lite", "Aeris", "women", "running", 7299, 8499, 4.7, 122, "stride", "blush-runner", true, false, "Breathable mesh"],
  ["terra-trail-glide", "Terra Trail Glide", "Terra", "unisex", "running", 9899, null, 4.8, 87, "urban-trekker", "olive-trail", false, true, "Ripstop mesh"],
  ["adidas-ultraboost-5", "Ultraboost 5", "Adidas", "men", "running", 8999, 11999, 4.5, 141, "footwork-collective", "obsidian-knit", false, false, "Knit + TPU"],
  ["aeris-tempo", "Aeris Tempo", "Aeris", "women", "running", 5999, 7499, 4.6, 76, "sole-theory", "pastel-drift", false, false, "Engineered mesh"],
  ["new-balance-530", "530", "New Balance", "unisex", "running", 7999, null, 4.7, 69, "sneaker-house", "white-azure", true, false, "Monofilament mesh"],
  ["pace-stride-2", "Pace Stride 2", "Pace", "men", "running", 4799, 5999, 4.4, 203, "footwork-collective", "black-runner", false, false, "Recycled mesh"],
  ["halo-cloud-run", "Halo Cloud Run", "Halo", "women", "running", 4299, 5299, 4.5, 188, "stride", "chalk-knit", false, false, "Soft knit"],

  ["nike-court-vision-low", "Court Vision Low", "Nike", "unisex", "sneakers", 7499, null, 4.8, 342, "sole-theory", "cream-heritage", false, true, "Full-grain leather"],
  ["rove-metro-low", "Rove Metro Low", "Rove", "men", "sneakers", 4999, 7499, 4.6, 211, "sneaker-house", "mono-court", false, false, "Suede + canvas"],
  ["rove-palisade", "Rove Palisade", "Rove", "unisex", "sneakers", 8799, 10999, 4.7, 134, "sneaker-house", "olive-suede", true, false, "Nubuck"],
  ["aster-cloudstep", "Aster Cloudstep", "Aster", "women", "sneakers", 3999, 4999, 4.5, 176, "footwork-collective", "pastel-drift", false, false, "Knit"],
  ["norr-alpine-90", "Norr Alpine 90", "Norr", "unisex", "sneakers", 9999, null, 4.9, 91, "urban-trekker", "cream-court-ledge", true, true, "Suede + mesh"],
  ["aster-everyday-canvas", "Aster Everyday Canvas", "Aster", "unisex", "sneakers", 2299, 3499, 4.3, 265, "leather-and-lace", "ivory-still-life", false, false, "Organic canvas"],
  ["rove-halfpipe", "Rove Halfpipe", "Rove", "men", "sneakers", 6499, 7999, 4.8, 144, "sneaker-house", "burgundy-low", false, true, "Suede"],
  ["halo-glide-knit", "Halo Glide Knit", "Halo", "women", "sneakers", 3499, 4499, 4.4, 132, "sole-theory", "blush-runner", false, false, "Stretch knit"],
  ["norr-coast-low", "Norr Coast Low", "Norr", "men", "sneakers", 5799, null, 4.6, 88, "footwork-collective", "sunburst-street", true, false, "Canvas + leather"],
  ["aster-court-classic", "Aster Court Classic", "Aster", "kids", "sneakers", 1999, 2499, 4.7, 92, "little-feet", "scarlet-hi", false, false, "Leather"],
  ["rove-static-mid", "Rove Static Mid", "Rove", "unisex", "sneakers", 7299, 8999, 4.5, 61, "sneaker-house", "grey-sock", true, false, "Technical mesh"],
  ["norr-heritage-hi", "Norr Heritage Hi", "Norr", "men", "sneakers", 8599, null, 4.7, 73, "miller-and-sons", "bone-hi-top", false, false, "Full-grain leather"],
  ["aster-luna-platform", "Aster Luna Platform", "Aster", "women", "sneakers", 5299, 6499, 4.6, 109, "leather-and-lace", "aqua-platform", false, false, "Leather"],
  ["rove-tone-runner", "Rove Tone Runner", "Rove", "women", "sneakers", 4599, 5799, 4.4, 154, "sole-theory", "pastel-drift", false, false, "Suede + mesh"],
  ["halo-easy-slip", "Halo Easy Slip", "Halo", "women", "sneakers", 2999, 3799, 4.5, 198, "footwork-collective", "ivory-still-life", false, true, "Canvas"],
  ["aster-chrome-low", "Aster Chrome Low", "Aster", "unisex", "sneakers", 6899, 8299, 4.6, 47, "footwork-collective", "steel-street", true, false, "Metallic leather"],
  ["norr-ghost-knit", "Norr Ghost Knit", "Norr", "men", "sneakers", 6499, null, 4.8, 126, "sole-theory", "ghost-runner", false, false, "Knit"],
  ["rove-gum-court", "Rove Gum Court", "Rove", "unisex", "sneakers", 4299, 5299, 4.3, 89, "sneaker-house", "amber-court", false, false, "Suede"],
  ["aster-mini-court", "Aster Mini Court", "Aster", "kids", "sneakers", 1699, 2199, 4.8, 64, "little-feet", "volt-court-hi", true, false, "Washable canvas"],

  ["kavan-oxford-no7", "Kavan Oxford No.7", "Kavan", "men", "formal", 6999, 8499, 4.8, 167, "miller-and-sons", "espresso-derby", false, true, "Box calf leather"],
  ["loom-last-regent", "Loom & Last Regent Derby", "Loom & Last", "men", "formal", 5499, null, 4.6, 78, "leather-and-lace", "cognac-loafer", false, false, "Suede"],
  ["kavan-chelsea-boot", "Kavan Chelsea", "Kavan", "men", "formal", 7999, 9499, 4.7, 102, "miller-and-sons", "black-chelsea", false, false, "Polished leather"],
  ["loom-last-mayfair", "Loom & Last Mayfair Loafer", "Loom & Last", "men", "formal", 4599, 5999, 4.5, 121, "leather-and-lace", "cognac-loafer", false, false, "Leather"],
  ["kavan-brogue-cap", "Kavan Brogue Cap", "Kavan", "men", "formal", 6299, 7499, 4.6, 57, "miller-and-sons", "oxblood-oxford", true, false, "Hand-burnished leather"],
  ["marlowe-sling-pump", "Marlowe Sling Pump", "Marlowe", "women", "formal", 4899, 5999, 4.5, 66, "leather-and-lace", "ivory-pump", false, false, "Satin"],

  ["terra-ridge-hiker", "Terra Ridge Hiker", "Terra", "unisex", "boots", 9499, 11499, 4.9, 132, "urban-trekker", "tan-desert-boot", false, true, "Waterproof nubuck"],
  ["kavan-desert-boot", "Kavan Desert Boot", "Kavan", "men", "boots", 6899, null, 4.6, 94, "miller-and-sons", "trail-lace", false, false, "Suede"],
  ["terra-storm-chelsea", "Terra Storm Chelsea", "Terra", "women", "boots", 7499, 8999, 4.7, 58, "urban-trekker", "black-chelsea", true, false, "Waterproof leather"],
  ["urban-trail-lace", "Urban Trail Lace", "Terra", "men", "boots", 5899, 7299, 4.4, 87, "urban-trekker", "olive-trail", false, false, "Nubuck"],
  ["terra-rain-boot", "Terra Rain Boot", "Terra", "kids", "boots", 2499, 2999, 4.6, 41, "little-feet", "black-chelsea", false, false, "Rubber"],

  ["halo-sand-slide", "Halo Sand Slide", "Halo", "unisex", "sandals", 1499, 2499, 4.4, 203, "footwork-collective", "sand-slide", false, true, "Moulded EVA"],
  ["marlowe-heel-sandal", "Marlowe Heel Sandal", "Marlowe", "women", "sandals", 3299, 4199, 4.5, 74, "leather-and-lace", "sand-slide", false, false, "Leather"],
  ["aster-beach-slide", "Aster Beach Slide", "Aster", "kids", "sandals", 999, 1299, 4.7, 58, "little-feet", "aqua-platform", true, false, "Water-friendly EVA"],

  ["pace-court-pro", "Pace Court Pro", "Pace", "men", "sports", 6999, 8499, 4.7, 117, "stride", "white-azure", false, false, "Synthetic leather"],
  ["pace-training-grip", "Pace Training Grip", "Pace", "unisex", "sports", 5399, 6499, 4.6, 84, "stride", "volt-court-hi", false, false, "Mesh + rubber"],
  ["velo-sprint-spike", "Velo Sprint Spike", "Velo", "men", "sports", 4299, null, 4.5, 32, "stride", "red-racer", true, false, "Technical mesh"],
  ["pace-junior-trainer", "Pace Junior Trainer", "Pace", "kids", "sports", 2299, 2799, 4.6, 51, "little-feet", "cobalt-runner", false, false, "Mesh"],
  ["halo-court-social", "Halo Court Social", "Halo", "women", "sports", 3799, 4499, 4.4, 96, "footwork-collective", "aqua-platform", false, false, "Canvas"],

  ["marlowe-sculpt-heel", "Marlowe Sculpt Heel", "Marlowe", "women", "formal", 5999, 7299, 4.7, 89, "leather-and-lace", "ivory-pump", false, true, "Leather"],
  ["marlowe-satin-stiletto", "Marlowe Satin Stiletto", "Marlowe", "women", "formal", 4499, null, 4.4, 43, "leather-and-lace", "cerulean-heel", true, false, "Satin"],
  ["marlowe-block-sandal", "Marlowe Block Sandal", "Marlowe", "women", "sandals", 3899, 4699, 4.6, 71, "leather-and-lace", "oxblood-platform", false, false, "Leather"],
  ["marlowe-aqua-mule", "Marlowe Aqua Mule", "Marlowe", "women", "sandals", 3299, 3999, 4.3, 37, "leather-and-lace", "aqua-platform", false, false, "Suede"],

  ["norr-easy-loafer", "Norr Easy Loafer", "Norr", "men", "casual", 5499, null, 4.7, 92, "sole-theory", "cognac-loafer", false, false, "Suede"],
  ["aster-slip-on", "Aster Slip-On", "Aster", "women", "casual", 2799, 3999, 4.5, 143, "footwork-collective", "teal-classic", false, false, "Canvas"],
  ["halo-soft-walk", "Halo Soft Walk", "Halo", "unisex", "casual", 3299, 3999, 4.6, 178, "footwork-collective", "ivory-still-life", false, true, "Knit"],
  ["norr-weekend", "Norr Weekend", "Norr", "unisex", "casual", 4599, 5499, 4.5, 68, "sole-theory", "burgundy-low", false, false, "Suede + canvas"],
  ["aster-mini-slip", "Aster Mini Slip", "Aster", "kids", "casual", 1499, 1899, 4.7, 52, "little-feet", "pastel-drift", false, false, "Canvas"],
  ["kavan-city-loafer", "Kavan City Loafer", "Kavan", "men", "casual", 4999, 6299, 4.6, 74, "miller-and-sons", "black-chelsea", false, false, "Leather"],
  ["aster-coral-canvas", "Aster Coral Canvas", "Aster", "women", "casual", 2499, 3199, 4.4, 112, "sole-theory", "coral-runner", false, false, "Organic canvas"],
  ["halo-eco-slide", "Halo Eco Slide", "Halo", "unisex", "casual", 1299, 1599, 4.3, 84, "footwork-collective", "sand-slide", false, false, "Recycled EVA"],

  ["rove-night-runner", "Rove Night Runner", "Rove", "men", "sneakers", 7199, 8999, 4.6, 58, "sneaker-house", "black-runner", true, false, "Reflective knit"],
  ["norr-suede-low", "Norr Suede Low", "Norr", "women", "sneakers", 5899, null, 4.7, 63, "sole-theory", "olive-suede", false, false, "Suede"],
  ["terra-camp-mule", "Terra Camp Mule", "Terra", "women", "sandals", 3499, 4299, 4.4, 29, "urban-trekker", "sand-slide", false, false, "Nubuck"],
  ["kavan-weekend-derby", "Kavan Weekend Derby", "Kavan", "men", "formal", 4999, null, 4.5, 48, "miller-and-sons", "espresso-derby", false, false, "Oiled leather"],
  ["bramble-play-sneaker", "Bramble Play Sneaker", "Bramble", "kids", "sneakers", 1899, 2399, 4.8, 81, "little-feet", "scarlet-hi", false, true, "Washable mesh"],
  ["marlowe-cap-toe", "Marlowe Cap Toe", "Marlowe", "women", "formal", 5499, 6599, 4.6, 54, "leather-and-lace", "oxblood-oxford", false, false, "Patent leather"]
];

const colorsFor = (base, cat, idx) => {
  const [name, hex] = IMG_COLOR[base] || ["Signature", "#333333"];
  const extras = cat === "women"
    ? [["Bone", "#E8E0D3"], ["Olive", "#5A6048"], ["Black", "#232323"]]
    : cat === "kids"
      ? [["Sunny", "#E3B13D"], ["Sky", "#6FA7C8"], ["Multi", "#B9A0A8"]]
      : [["Black", "#232323"], ["Bone", "#E7DFD1"], ["Olive", "#5A6048"]];
  const poolImgs = cat === "women" ? womenPool : cat === "kids" ? kidsPool : shoePools.sneakers;
  return [
    { name, hex, image: img(base) },
    { name: extras[idx % extras.length][0], hex: extras[idx % extras.length][1], image: img(poolImgs[(idx + 5) % poolImgs.length]) },
    { name: extras[(idx + 1) % extras.length][0], hex: extras[(idx + 1) % extras.length][1], image: img(poolImgs[(idx + 11) % poolImgs.length]) }
  ];
};

const buildSizes = (cat, seed) => {
  const set = cat === "kids" ? [10, 11, 12, 13, 1, 2, 3, 4, 5]
    : cat === "women" ? [3, 4, 5, 6, 7, 8, 9]
      : cat === "men" ? [6, 7, 8, 9, 10, 11, 12]
        : [5, 6, 7, 8, 9, 10, 11, 12];
  return set.map((size, i) => {
    const v = (seed * 7 + i * 13) % 11;
    return { size, stock: v < 3 ? 0 : v > 8 ? 1 + (v % 2) : 2 + (v % 6) };
  });
};

const descBits = {
  running: ["Built for daily miles with a responsive foam midsole and a breathable engineered upper.", "A light, neutral daily trainer that disappears on foot after the first kilometre.", "Tested on Bengaluru's early-morning roads — cushioned enough for long days, quick enough for tempo."],
  sneakers: ["A clean court silhouette with a cupsole that only gets better with wear.", "Easy to style, easier to live in — premium materials and a quiet finish.", "The kind of pair that works with everything from denim to tailoring."],
  formal: ["Hand-finished leather, a leather-lined interior and a shape that holds its polish.", "Built to be resoled, worn for decades and kept in the family.", "A considered silhouette for weddings, work and everything between."],
  boots: ["A weather-ready build with a lugged outsole and reinforced ankle.", "Made for city rain and weekend trailheads alike.", "Full-grain leather and a proper commando sole, ready for the long way home."],
  sandals: ["Soft, moulded footbeds and a light outsole for all-day wear.", "An easy, breathable pair that packs flat for weekends away.", "Cushioned comfort with just enough structure for long walks."],
  sports: ["Stability where you need it, flexibility where you don't — a proper performance build.", "Court-ready traction and a locked-in fit for quick direction changes.", "Lightweight support for training days and match days."],
  casual: ["An uncomplicated everyday pair in soft, supple materials.", "Slip-on comfort with a clean, low-profile shape.", "A quiet staple that works for errands, travel and everything after."]
};

const materialNotes = {
  "Full-grain leather": "Full-grain leather upper, cotton laces, removable cushioned insole and a stitched rubber outsole.",
  "Box calf leather": "Hand-finished box calf leather, leather lining, Blake-stitched sole and brass eyelets.",
  "Suede": "Buttery suede upper with a soft calf lining and a flexible gum sole.",
  "Knit": "One-piece recycled knit upper with a padded collar and a lightweight blown-rubber sole.",
  "Engineered mesh": "Engineered mesh upper, gusseted tongue and a dual-density EVA midsole.",
  "Recycled mesh": "Recycled mesh upper and laces with a compression-moulded EVA midsole.",
  "Waterproof nubuck": "Waterproof nubuck upper with a seam-sealed membrane and a Vibram-pattern lug sole.",
  "Moulded EVA": "Single-piece moulded EVA with a contoured footbed and a textured grip outsole.",
  "Leather": "Soft leather upper with a leather-lined footbed and durable rubber outsole.",
  "Canvas": "Heavyweight organic canvas, vulcanised rubber sole and metal eyelets.",
  "Organic canvas": "Organic cotton canvas with a recycled-rubber cupsole.",
  "Technical mesh": "Technical mesh with TPU overlays and a responsive foam midsole.",
  "Satin": "Satin upper, leather lining and a covered heel with a rubber heel tap.",
  "Nubuck": "Sand-toned nubuck with tonal stitching and a lightweight lug outsole."
};

const reviewBank = [
  ["Ananya R.", 5, "Exactly what the photos promised", "Fit true to size and the leather is softer than I expected. The team at the shop even waterproofed them for me before I left."],
  ["Rahul M.", 4, "Great pair, slightly narrow", "Really comfortable after two wears. I usually take a wide fit, so I sized up and it's perfect now."],
  ["Meera S.", 5, "Worth the price", "Packaging was lovely, delivery was a day early, and the colour is even better in person. Have worn these almost daily."],
  ["Karthik V.", 4, "Solid everyday shoe", "Build quality is excellent for the price. Took a couple of days to break in around the heel."],
  ["Sana P.", 5, "Excellent local find", "Ordered online and collected in store in under an hour. The fitting advice was spot on."],
  ["Dev A.", 4, "Happy, would buy again", "Comfortable for long city walks. Wish there were more colour options in my size."],
  ["Nikhil T.", 5, "Second pair", "Replaced a very old pair with these. The finish is neat and the sole feels premium."],
  ["Ishita K.", 5, "So comfortable", "Wore them straight out of the box for a 10-hour day with no issues."],
  ["Arjun N.", 3, "Good but runs small", "Quality is good, but definitely size up half. The exchange in store was hassle-free though."],
  ["Priya D.", 4, "Lovely details", "The little touches — extra laces, dust bag — make this feel more expensive than it is."],
  ["Vikram S.", 5, "Local shop experience was the best part", "Easy pickup and they adjusted the fit while I waited."],
  ["Tara B.", 4, "Versatile", "Dresses up or down. Slightly stiff at first but settled in nicely."]
];

const shopsById = Object.fromEntries(shops.map(s => [s.id, s]));
const products = productRows.map((row, index) => {
  const [id, name, brand, category, type, price, oldPrice, rating, reviewCount, shopId, primary, isNew, isBestSeller, material] = row;
  const indexSeed = index + 1;
  let pool = shoePools[type] || shoePools.sneakers;
  if (category === "women") pool = type === "formal" ? womenPool : type === "boots" ? ["black-chelsea", "tan-desert-boot"] : womenPool;
  if (category === "kids") pool = kidsPool;
  const base = primary || pool[index % pool.length];
  const gallery = [base];
  for (let k = 1; k < 4; k++) {
    const candidate = pool[(index + k * 3) % pool.length];
    if (!gallery.includes(candidate)) gallery.push(candidate);
  }
  const colors = colorsFor(base, category, index);
  const sizes = buildSizes(category, indexSeed);
  const inStockTotal = sizes.reduce((a, s) => a + s.stock, 0);
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const short = `${name} in ${colors[0].name.toLowerCase()} — ${descBits[type][index % 3]}`;
  const description = `${descBits[type][(index + 1) % 3]} ${materialNotes[material] || material + " upper with a durable outsole."} Finished with a padded collar and a removable footbed, and sold with a 30-day fit guarantee by ${shopsById[shopId].name} in ${shopsById[shopId].area}.`;
  const reviewPicks = [reviewBank[index % 12], reviewBank[(index + 3) % 12], reviewBank[(index + 7) % 12]];
  const reviews = reviewPicks.map((r, ri) => ({
    author: r[0],
    rating: ri === 1 ? Math.max(3, Math.min(5, Math.round(rating))) : (ri === 2 ? Math.min(5, Math.ceil(rating)) : Math.round(rating)),
    title: r[2],
    body: r[3],
    date: ["2026-08-14", "2026-06-02", "2026-04-21"][ri],
    verified: ri !== 2
  }));
  const releaseDate = isNew ? `2026-0${7 + (index % 3)}-${String(4 + (index % 22)).padStart(2, "0")}` : `202${4 + (index % 3)}-${String(1 + (index % 9)).padStart(2, "0")}-15`;

  return {
    id, name, brand, category, type, price,
    oldPrice, discount,
    currency: "INR",
    colors,
    sizes,
    rating, reviewCount,
    shortDescription: short,
    description,
    material,
    tags: [type, brand.toLowerCase(), category, colors[0].name.toLowerCase(), ...(isNew ? ["new"] : []), ...(isBestSeller ? ["bestseller"] : [])],
    shopId,
    images: gallery.map(img),
    isNew: !!isNew,
    isBestSeller: !!isBestSeller,
    inStock: inStockTotal > 0,
    stockTotal: inStockTotal,
    releaseDate,
    sku: `LS-${brand.slice(0, 3).toUpperCase()}-${String(indexSeed).padStart(4, "0")}`,
    reviews,
    highlights: [
      materialNotes[material]?.split(",")[0] || material,
      category === "kids" ? "Removable grow-room insole" : "Removable cushioned footbed",
      type === "formal" ? "Resoleable construction" : "30-day fit guarantee"
    ],
    offers: []
  };
});

// Price comparison offers across nearby shops for a curated subset.
const offerPrices = {
  "nike-court-vision-low": [["sneaker-house", 7299], ["footwork-collective", 7699]],
  "nike-pegasus-41": [["sole-theory", 9299], ["sneaker-house", 8799]],
  "rove-halfpipe": [["sole-theory", 6799], ["footwork-collective", 6299]],
  "kavan-oxford-no7": [["leather-and-lace", 7299], ["sole-theory", 7499]],
  "terra-ridge-hiker": [["miller-and-sons", 9799], ["sole-theory", 9499]],
  "halo-sand-slide": [["sole-theory", 1599], ["leather-and-lace", 1399]],
  "norr-alpine-90": [["sole-theory", 10499], ["sneaker-house", 9799]],
  "halo-easy-slip": [["sole-theory", 3299], ["leather-and-lace", 3099]],
  "nike-vaporfly-3": [["sneaker-house", 17499], ["footwork-collective", 16299]],
  "marlowe-sculpt-heel": [["sole-theory", 6199], ["footwork-collective", 6299]],
  "aster-chrome-low": [["sneaker-house", 7199], ["sole-theory", 6699]],
  "bramble-play-sneaker": [["little-feet", 1999], ["sole-theory", 2099]],
  "kavan-chelsea-boot": [["leather-and-lace", 8299], ["urban-trekker", 7899]],
  "norr-heritage-hi": [["sole-theory", 8299], ["sneaker-house", 8999]],
  "halo-soft-walk": [["sole-theory", 3499], ["leather-and-lace", 3199]],
  "terra-storm-chelsea": [["miller-and-sons", 7799], ["leather-and-lace", 7699]]
};
products.forEach(p => {
  const offers = offerPrices[p.id];
  if (!offers) return;
  p.offers = offers.map(([shopId, price]) => ({
    shopId,
    price,
    sizes: p.sizes.filter(() => true).slice(0, 5).map(s => s.size),
    inStock: true
  }));
});

const data = {
  meta: {
    generated: "2026-10-21",
    currency: "INR",
    note: "Demo catalogue for Local Sole. Prices are in Indian Rupees."
  },
  shops,
  products
};

fs.writeFileSync(path.join(ROOT, "data", "products.json"), JSON.stringify({ meta: data.meta, products }, null, 2));
fs.writeFileSync(path.join(ROOT, "data", "shops.json"), JSON.stringify({ meta: data.meta, shops }, null, 2));
fs.writeFileSync(path.join(ROOT, "data", "seed.js"), "/* Auto-generated fallback for file:// usage. Keep in sync with products.json + shops.json. */\nwindow.LOCAL_SHOE_DATA = " + JSON.stringify(data) + ";\n");

console.log(`Generated ${products.length} products across ${shops.length} shops.`);
console.log("Types:", [...new Set(products.map(p => p.type))].map(t => `${t}:${products.filter(p => p.type === t).length}`).join(" "));
console.log("Categories:", [...new Set(products.map(p => p.category))].map(c => `${c}:${products.filter(p => p.category === c).length}`).join(" "));
console.log("Shops product counts:", shops.map(s => `${s.shortName}:${products.filter(p => p.shopId === s.id).length}`).join(" "));
