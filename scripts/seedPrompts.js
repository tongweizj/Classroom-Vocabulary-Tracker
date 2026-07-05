const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");

const defaults = [
  {
    name: "ASR Correction Prompt",
    category: "correction",
    content: `You are an ASR correction assistant. Fix the following English classroom transcript by correcting speech recognition errors. Do NOT remove any words or change meaning. Only fix mistranscribed technical terms, abbreviations, and proper nouns.

Common corrections:
- "React J.S." / "React JS" → "React.js"
- "Node Js" / "node j.s." → "Node.js"
- "API Gateway" → "API Gateway"
- "rest api" → "REST API"
- "json" → "JSON"

Original text to correct:`,
  },
  {
    name: "Transcript Cleaning Prompt",
    category: "cleaning",
    content: `You are a transcript cleaner. Clean the following classroom transcript by:
1. Removing filler words (um, uh, you know, like, okay, right, kind of, sort of)
2. Fixing grammar and punctuation
3. Making sentences flow naturally
4. Keeping all technical content and key terms intact
5. Do NOT add or remove any technical information

Original text:`,
  },
  {
    name: "Vocabulary Extraction Prompt",
    category: "vocabulary",
    content: `Extract vocabulary items from this classroom transcript. For each item, provide:
- itemText: the exact phrase or word
- itemType: one of [core_term, technical_phrase, classroom_instruction, assignment_phrase, speaking_sentence]
- meaningCn: Chinese translation
- frequency: number of times it appears
- sourceSentence: the original sentence containing it
- priority: high/medium/low based on importance

Output as a JSON items array.

Transcript:`,
  },
];

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is not set.");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected.");

  const Prompt = require("../src/models/Prompt");

  let created = 0;
  let skipped = 0;

  for (const item of defaults) {
    const existing = await Prompt.findOne({ name: item.name, category: item.category });
    if (existing) {
      skipped++;
      continue;
    }
    await Prompt.create(item);
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
