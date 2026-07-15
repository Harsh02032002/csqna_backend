import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All xlsx files to convert
const INPUT_FILES = [
  "e:/osa-data/AAIA Questionnarie Basics_06th Feb'26.xlsx",
  "e:/osa-data/DPDP Questionnarie Basics_05th Dec'25.xlsx",
  "e:/osa-data/DPDP Questionnarie Basics_21th Nov'25.xlsx",
  "e:/osa-data/DPDP Questionnarie Basics_28th Nov'25.xlsx",
  "e:/osa-data/DPO Questionnarie Basics_03rd Nov'25.xlsx",
  "e:/osa-data/DPO Questionnarie Basics_10th Nov'25.xlsx",
  "e:/osa-data/DPO Questionnarie Basics_14th Nov'25.xlsx",
];

// Map difficulty level text to backend format
function mapDifficulty(val) {
  if (!val) return 'Medium';
  const v = String(val).toLowerCase().trim();
  if (v.includes('beginner') || v.includes('basic') || v.includes('easy')) return 'Easy';
  if (v.includes('advanced') || v.includes('expert') || v.includes('hard')) return 'Hard';
  return 'Medium'; // intermediate, moderate, etc.
}

// Map question type to backend format
function mapQuestionType(val) {
  if (!val) return 'MCQ';
  const v = String(val).toUpperCase().trim();
  if (v.includes('MSQ') || v.includes('MULTIPLE SELECT') || v.includes('MULTI')) return 'MSQ';
  return 'MCQ';
}

function safe(val) {
  if (val === undefined || val === null) return '';
  if (val instanceof Date) return '';
  return String(val).trim();
}

async function convertFile(inputPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(inputPath);
  const ws = wb.worksheets[0];

  // Get header row to build index map
  const headerValues = ws.getRow(1).values; // 1-indexed
  const headerMap = {};
  headerValues.forEach((h, i) => {
    if (h) headerMap[String(h).trim()] = i;
  });

  // Helper: get cell by header name
  const col = (row, name) => {
    // Try exact match first
    if (headerMap[name] !== undefined) return safe(row.values[headerMap[name]]);
    // Try case-insensitive / partial match
    const lname = name.toLowerCase();
    for (const [k, v] of Object.entries(headerMap)) {
      if (k.toLowerCase().includes(lname)) return safe(row.values[v]);
    }
    return '';
  };

  // Build output workbook
  const outWb = new ExcelJS.Workbook();
  const outWs = outWb.addWorksheet('Questions');

  // Write required headers
  const requiredHeaders = [
    'Category', 'Area', 'Question',
    'Option1', 'Option2', 'Option3', 'Option4',
    'CorrectOption1', 'CorrectOption2', 'CorrectOption3', 'CorrectOption4',
    'Justification1', 'Justification2', 'Justification3', 'Justification4',
    'QuestionType', 'DifficultyLevel'
  ];
  outWs.addRow(requiredHeaders);

  let count = 0;
  const totalRows = ws.actualRowCount;

  ws.eachRow((row, rowIdx) => {
    if (rowIdx === 1) return; // skip header

    const questionText = col(row, 'Question');
    if (!questionText || questionText.length < 5) return; // skip empty/invalid rows

    // Get options
    const opt1 = col(row, 'Option 1');
    const opt2 = col(row, 'Option 2');
    const opt3 = col(row, 'Option 3');
    const opt4 = col(row, 'Option 4');

    // Get correct answer - column 'CORRECT ANSWER' has the actual answer text
    const correctAnswerText = col(row, 'CORRECT ANSWER');
    // Also check 'Correct Answer Option' which may say "Option 1", "Option 2", "1", "2" etc.
    const correctAnswerOption = col(row, 'Correct Answer Option').toLowerCase();

    // Determine which option is correct and put text in CorrectOption1 (backend uses index 0 for MCQ)
    let correctOpt1 = '';
    let correctOpt2 = '';
    let correctOpt3 = '';
    let correctOpt4 = '';

    // If we have the correct answer text, use it directly as CorrectOption1
    if (correctAnswerText) {
      correctOpt1 = correctAnswerText;
    } else if (correctAnswerOption) {
      // Map "option 1" / "1" / "a" → the text of that option
      if (correctAnswerOption.includes('1') || correctAnswerOption === 'a') {
        correctOpt1 = opt1;
      } else if (correctAnswerOption.includes('2') || correctAnswerOption === 'b') {
        correctOpt1 = opt2;
      } else if (correctAnswerOption.includes('3') || correctAnswerOption === 'c') {
        correctOpt1 = opt3;
      } else if (correctAnswerOption.includes('4') || correctAnswerOption === 'd') {
        correctOpt1 = opt4;
      } else {
        correctOpt1 = opt1; // default
      }
    } else {
      correctOpt1 = opt1; // fallback: first option is correct
    }

    const category = col(row, 'Knowledge to be tested') || col(row, 'Description') || 'General';
    const area = col(row, 'Topic Name') || col(row, 'Module name') || category;
    const questionType = mapQuestionType(col(row, 'Type of Question'));
    const difficulty = mapDifficulty(col(row, 'Competency Level'));

    const justification1 = col(row, 'Explanation  1') || col(row, 'Explanation 1') || correctOpt1;
    const justification2 = col(row, 'Explanation 2') || '';
    const justification3 = col(row, 'Explanation 3') || '';
    const justification4 = col(row, 'Explanation 4') || '';

    outWs.addRow([
      category,
      area,
      questionText,
      opt1, opt2, opt3, opt4,
      correctOpt1, correctOpt2, correctOpt3, correctOpt4,
      justification1, justification2, justification3, justification4,
      questionType,
      difficulty
    ]);

    count++;
  });

  // Save converted file
  const baseName = path.basename(inputPath, '.xlsx');
  const outputPath = path.join('e:/osa-data', `CONVERTED_${baseName}.xlsx`);
  await outWb.xlsx.writeFile(outputPath);
  console.log(`✅ Converted: ${baseName} → ${count} questions → ${outputPath}`);
  return outputPath;
}

console.log('🔄 Starting Excel conversion...\n');

for (const file of INPUT_FILES) {
  try {
    await convertFile(file);
  } catch (err) {
    console.error(`❌ Error with ${path.basename(file)}:`, err.message);
  }
}

console.log('\n🎉 All files converted! Upload CONVERTED_*.xlsx files from e:/osa-data/');
