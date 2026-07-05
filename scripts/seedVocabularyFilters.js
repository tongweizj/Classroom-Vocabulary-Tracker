const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const { normalizeExpression } = require("../src/utils/normalize");

const seedData = [
  // stop_word
  ...["the","a","an","is","are","was","were","be","been","being"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "default stop word",
  })),
  ...["i","you","he","she","it","we","they"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "pronoun",
  })),
  ...["this","that","these","those"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "demonstrative",
  })),
  ...["and","or","but","so","because"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "conjunction",
  })),
  ...["in","on","at","to","for","from","with","of","by"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "preposition",
  })),
  ...["do","does","did","have","has","had"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "auxiliary",
  })),
  ...["can","could","will","would","should"].map((t) => ({
    filterText: t, filterType: "stop_word", action: "remove",
    notes: "modal",
  })),

  // filler
  ...[
    ["uh", "filler", "remove"],
    ["um", "filler", "remove"],
    ["okay", "filler", "remove"],
    ["yeah", "filler", "remove"],
    ["you know", "filler", "remove"],
    ["right", "filler", "remove"],
    ["kind of", "filler", "remove"],
    ["sort of", "filler", "remove"],
    ["maybe", "filler", "remove"],
    ["actually", "filler", "remove"],
    ["probably", "filler", "remove"],
    ["something like that", "filler", "remove"],
  ].map(([t, ft, act]) => ({
    filterText: t, filterType: ft, action: act,
    notes: "filler word",
  })),

  // keep_phrase
  ...[
    "make sure",
    "go through",
    "take a look at",
    "show me",
    "try it on your side",
    "connect to the backend",
    "consume REST API",
    "find by ID",
    "run your server",
    "change the URL",
    "API Gateway",
    "REST API",
    "JSON format",
  ].map((t) => ({
    filterText: t, filterType: "keep_phrase", action: "keep",
    notes: "instructional phrase",
  })),
];

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected.");

  const VocabularyFilter = require("../src/models/VocabularyFilter");

  let created = 0;
  let skipped = 0;

  for (const item of seedData) {
    const normalizedText = normalizeExpression(item.filterText);

    const existing = await VocabularyFilter.findOne({
      normalizedText,
      filterType: item.filterType,
    });

    if (existing) {
      skipped++;
      continue;
    }

    await VocabularyFilter.create({
      ...item,
      normalizedText,
      isActive: true,
    });
    created++;
  }

  console.log(`Seed complete: ${created} created, ${skipped} already existed.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
