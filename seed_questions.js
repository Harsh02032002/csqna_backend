import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB connection (same as backend .env)
const URI = "mongodb://prashnavali_csqna:N7%40qL%235vXp%212Rm%248Hy%5E4Tk%269Zw%2A3BcMd@93.127.166.48:27017/prashnavali?authSource=prashnavali";

// All CONVERTED files to seed
const CONVERTED_FILES = [
  "e:/osa-data/CONVERTED_DPDP Questionnarie Basics_05th Dec'25.xlsx",
  "e:/osa-data/CONVERTED_DPDP Questionnarie Basics_21th Nov'25.xlsx",
  "e:/osa-data/CONVERTED_DPDP Questionnarie Basics_28th Nov'25.xlsx",
  "e:/osa-data/CONVERTED_DPO Questionnarie Basics_03rd Nov'25.xlsx",
  "e:/osa-data/CONVERTED_DPO Questionnarie Basics_10th Nov'25.xlsx",
  "e:/osa-data/CONVERTED_DPO Questionnarie Basics_14th Nov'25.xlsx",
];

const QuestionsSchema = new mongoose.Schema({
  category: { type: String, required: true },
  area: { type: String, required: true },
  question: { type: String, required: true },
  options: {
    Option1: { type: String, required: true },
    Option2: { type: String, required: true },
    Option3: { type: String },
    Option4: { type: String },
  },
  correctAnswers: [String],
  justifications: {
    Option1: { type: String, required: true },
    Option2: { type: String },
    Option3: { type: String },
    Option4: { type: String },
  },
  questionType: { type: String, required: true },
  difficultyLevel: { type: String, required: true },
}, { strict: false });

const safe = (v) => (v !== undefined && v !== null && !(v instanceof Date)) ? String(v).trim() : '';

async function seedFile(filePath, Questions) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const rowPromises = [];

  ws.eachRow((row, rowIdx) => {
    if (rowIdx === 1) return; // skip header
    const vals = row.values;

    const category = safe(vals[1]);
    const area = safe(vals[2]);
    const question = safe(vals[3]);
    const opt1 = safe(vals[4]);
    const opt2 = safe(vals[5]);
    const opt3 = safe(vals[6]);
    const opt4 = safe(vals[7]);
    const cor1 = safe(vals[8]);
    const cor2 = safe(vals[9]);
    const cor3 = safe(vals[10]);
    const cor4 = safe(vals[11]);
    const jus1 = safe(vals[12]);
    const jus2 = safe(vals[13]);
    const jus3 = safe(vals[14]);
    const jus4 = safe(vals[15]);
    const questionType = safe(vals[16]) || 'MCQ';
    const difficultyLevel = safe(vals[17]) || 'Medium';

    if (!question || question.length < 5) return;
    if (!category || !area) return;
    if (!opt1 || !opt2) return;

    const promise = Questions.findOne({ question }).then(existing => {
      if (existing) {
        skipped++;
        return;
      }
      const newQ = new Questions({
        category,
        area,
        question,
        options: { Option1: opt1, Option2: opt2, Option3: opt3, Option4: opt4 },
        correctAnswers: [cor1, cor2, cor3, cor4],
        justifications: { Option1: jus1 || cor1, Option2: jus2, Option3: jus3, Option4: jus4 },
        questionType,
        difficultyLevel,
      });
      return newQ.save().then(() => { inserted++; }).catch(err => {
        errors++;
        // console.error('Save error:', err.message);
      });
    });

    rowPromises.push(promise);
  });

  await Promise.all(rowPromises);
  console.log(`  ✅ ${path.basename(filePath)}: ${inserted} inserted, ${skipped} skipped (duplicates), ${errors} errors`);
}

async function main() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected!\n');

  const Questions = mongoose.model('questions', QuestionsSchema);

  for (const file of CONVERTED_FILES) {
    if (!fs.existsSync(file)) {
      console.log(`⚠️  File not found: ${path.basename(file)}`);
      continue;
    }
    process.stdout.write(`📂 Processing: ${path.basename(file)}...\n`);
    await seedFile(file, Questions);
  }

  const total = await Questions.countDocuments();
  console.log(`\n🎉 Done! Total questions in DB: ${total}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
