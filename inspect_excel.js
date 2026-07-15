import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required headers by backend
const REQUIRED_HEADERS = [
  'Category', 'Area', 'Question',
  'Option1', 'Option2', 'Option3', 'Option4',
  'CorrectOption1', 'CorrectOption2', 'CorrectOption3', 'CorrectOption4',
  'Justification1', 'Justification2', 'Justification3', 'Justification4',
  'QuestionType', 'DifficultyLevel'
];

const files = [
  "e:/osa-data/AAIA Questionnarie Basics_06th Feb'26.xlsx",
  "e:/osa-data/DPDP Questionnarie Basics_05th Dec'25.xlsx",
  "e:/osa-data/DPO Questionnarie Basics_03rd Nov'25.xlsx",
];

for (const filePath of files) {
  console.log('\n========================================');
  console.log('FILE:', path.basename(filePath));
  console.log('========================================');
  
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  
  const headerRow = ws.getRow(1).values;
  const headers = headerRow.slice(1).filter(Boolean);
  console.log('Headers found:', headers);
  
  // Show first data row
  const row2 = ws.getRow(2).values.slice(1);
  console.log('Sample row:', row2.slice(0, 5));
}
