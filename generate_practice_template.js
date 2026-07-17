import ExcelJS from 'exceljs';

// ─── Sample practice test questions ──────────────────────────────────────────
const questions = [
  {
    Category: 'Network Security',
    Area: 'Firewalls',
    Question: 'What is the primary function of a firewall in a network?',
    Option1: 'To encrypt data transmitted over the network',
    Option2: 'To monitor and control incoming and outgoing network traffic based on security rules',
    Option3: 'To assign IP addresses to devices on the network',
    Option4: 'To increase the speed of network communication',
    CorrectOption1: 'To monitor and control incoming and outgoing network traffic based on security rules',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'A firewall acts as a security barrier between trusted internal networks and untrusted external networks, filtering traffic based on predefined rules.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Easy',
  },
  {
    Category: 'Cryptography',
    Area: 'Encryption Algorithms',
    Question: 'Which of the following is a symmetric encryption algorithm?',
    Option1: 'RSA',
    Option2: 'AES',
    Option3: 'ECC',
    Option4: 'Diffie-Hellman',
    CorrectOption1: 'AES',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'AES (Advanced Encryption Standard) is a symmetric encryption algorithm that uses the same key for both encryption and decryption. RSA, ECC, and Diffie-Hellman are asymmetric.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Medium',
  },
  {
    Category: 'Malware Protection',
    Area: 'Types of Malware',
    Question: 'Which of the following BEST describes a ransomware attack?',
    Option1: 'Malware that secretly records keystrokes and sends them to an attacker',
    Option2: 'Malware that replicates itself to spread across networks without user interaction',
    Option3: 'Malware that encrypts the victim\'s files and demands payment for the decryption key',
    Option4: 'Malware disguised as legitimate software to trick users into installing it',
    CorrectOption1: 'Malware that encrypts the victim\'s files and demands payment for the decryption key',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'Ransomware encrypts files on the victim\'s system and demands a ransom (usually in cryptocurrency) in exchange for the decryption key. WannaCry and NotPetya are famous examples.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Easy',
  },
  {
    Category: 'Identity and Access Management',
    Area: 'Authentication',
    Question: 'Which of the following authentication factors qualify as "something you have"? (Select ALL that apply)',
    Option1: 'Hardware token (e.g., YubiKey)',
    Option2: 'Password',
    Option3: 'OTP sent to mobile phone',
    Option4: 'Fingerprint',
    CorrectOption1: 'Hardware token (e.g., YubiKey)',
    CorrectOption2: 'OTP sent to mobile phone',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'Hardware tokens and OTPs sent to a registered mobile phone are "something you have" factors. A password is "something you know" and a fingerprint is "something you are".',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MSQ',
    DifficultyLevel: 'Medium',
  },
  {
    Category: 'Data Protection and Privacy',
    Area: 'Data Classification',
    Question: 'An organization classifies customer PII as "Confidential". Which control is MOST appropriate?',
    Option1: 'Store PII in plain text in a public-facing database',
    Option2: 'Encrypt PII at rest and in transit and restrict access on a need-to-know basis',
    Option3: 'Share PII with all employees for business analytics',
    Option4: 'Delete PII after one month regardless of regulatory requirements',
    CorrectOption1: 'Encrypt PII at rest and in transit and restrict access on a need-to-know basis',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'Confidential data such as PII requires encryption both at rest and in transit, combined with strict access controls following the principle of least privilege.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Hard',
  },
  {
    Category: 'Security Risk Management',
    Area: 'Risk Assessment',
    Question: 'In risk management, what does the term "residual risk" mean?',
    Option1: 'The total risk before any controls are applied',
    Option2: 'The risk that remains after controls have been implemented',
    Option3: 'The risk transferred to a third party through insurance',
    Option4: 'The risk that is accepted by senior management',
    CorrectOption1: 'The risk that remains after controls have been implemented',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'Residual risk is the remaining level of risk after security controls and mitigations have been applied. It is different from inherent risk (risk before controls).',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Medium',
  },
  {
    Category: 'Network Security',
    Area: 'Intrusion Detection',
    Question: 'What is the difference between an IDS and an IPS?',
    Option1: 'IDS encrypts traffic while IPS decrypts it',
    Option2: 'IDS only detects and alerts on threats; IPS can also actively block them',
    Option3: 'IDS is hardware-based while IPS is software-based',
    Option4: 'There is no difference; they are the same technology',
    CorrectOption1: 'IDS only detects and alerts on threats; IPS can also actively block them',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'An Intrusion Detection System (IDS) monitors traffic and generates alerts. An Intrusion Prevention System (IPS) can take active steps to block or reject malicious traffic in real time.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Easy',
  },
  {
    Category: 'Cryptography',
    Area: 'PKI',
    Question: 'Which entity is responsible for issuing and managing digital certificates in a PKI?',
    Option1: 'Registration Authority (RA)',
    Option2: 'Certificate Authority (CA)',
    Option3: 'Key Distribution Center (KDC)',
    Option4: 'Certificate Revocation List (CRL)',
    CorrectOption1: 'Certificate Authority (CA)',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'The Certificate Authority (CA) is the trusted entity in a PKI that issues, signs, and manages digital certificates. The RA handles verification but delegates certificate issuance to the CA.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Medium',
  },
  {
    Category: 'Malware Protection',
    Area: 'Social Engineering',
    Question: 'A user receives an email appearing to be from their bank asking them to click a link and verify their account. This is BEST described as:',
    Option1: 'Vishing',
    Option2: 'Smishing',
    Option3: 'Phishing',
    Option4: 'Whaling',
    CorrectOption1: 'Phishing',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'Phishing uses deceptive emails to trick users into revealing sensitive information or clicking malicious links. Vishing is phone-based, Smishing is SMS-based, and Whaling targets senior executives.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Easy',
  },
  {
    Category: 'Security Risk Management',
    Area: 'Business Continuity',
    Question: 'Which of the following metrics defines the maximum tolerable downtime for a critical system?',
    Option1: 'Recovery Point Objective (RPO)',
    Option2: 'Recovery Time Objective (RTO)',
    Option3: 'Mean Time Between Failures (MTBF)',
    Option4: 'Mean Time To Repair (MTTR)',
    CorrectOption1: 'Recovery Time Objective (RTO)',
    CorrectOption2: '',
    CorrectOption3: '',
    CorrectOption4: '',
    Justification1: 'RTO defines the maximum acceptable time to restore a system after a disruption. RPO defines how much data loss is acceptable (time window). MTBF and MTTR relate to hardware reliability.',
    Justification2: '',
    Justification3: '',
    Justification4: '',
    QuestionType: 'MCQ',
    DifficultyLevel: 'Hard',
  },
];

// ─── Build Excel ──────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = 'CSQNA';
wb.created = new Date();

const ws = wb.addWorksheet('Practice Questions', {
  properties: { tabColor: { argb: 'FF854C93' } },
  views: [{ state: 'frozen', ySplit: 1 }],   // Freeze header row
});

const headers = [
  'Category', 'Area', 'Question',
  'Option1', 'Option2', 'Option3', 'Option4',
  'CorrectOption1', 'CorrectOption2', 'CorrectOption3', 'CorrectOption4',
  'Justification1', 'Justification2', 'Justification3', 'Justification4',
  'QuestionType', 'DifficultyLevel',
];

// ── Column widths
const colWidths = [22, 22, 60, 35, 35, 35, 35, 35, 35, 35, 35, 50, 50, 50, 50, 14, 14];
headers.forEach((h, i) => {
  ws.getColumn(i + 1).width = colWidths[i];
});

// ── Header row styling
const headerRow = ws.addRow(headers);
headerRow.height = 30;
headerRow.eachCell(cell => {
  cell.value        = cell.value;
  cell.fill         = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF854C93' } };
  cell.font         = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
  cell.alignment    = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cell.border       = {
    bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
    right:  { style: 'thin',   color: { argb: 'FFFFFFFF' } },
  };
});

// ── Data rows
questions.forEach((q, rowIdx) => {
  const row = ws.addRow([
    q.Category, q.Area, q.Question,
    q.Option1, q.Option2, q.Option3, q.Option4,
    q.CorrectOption1, q.CorrectOption2, q.CorrectOption3, q.CorrectOption4,
    q.Justification1, q.Justification2, q.Justification3, q.Justification4,
    q.QuestionType, q.DifficultyLevel,
  ]);

  row.height = 60;
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    // Alternate row colours
    const bgColor = rowIdx % 2 === 0 ? 'FFF9F5FF' : 'FFFFFFFF';
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.font      = { size: 10, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', wrapText: true,
                       horizontal: colNum <= 3 ? 'left' : 'left' };
    cell.border    = {
      top:    { style: 'thin', color: { argb: 'FFE8E0F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE8E0F0' } },
      left:   { style: 'thin', color: { argb: 'FFE8E0F0' } },
      right:  { style: 'thin', color: { argb: 'FFE8E0F0' } },
    };
  });

  // Colour-code DifficultyLevel cell (last column = col 17)
  const diffCell = row.getCell(17);
  const diff     = q.DifficultyLevel;
  if (diff === 'Easy')   diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  if (diff === 'Medium') diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
  if (diff === 'Hard')   diffCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
  diffCell.font = { bold: true, size: 10, name: 'Calibri' };

  // Colour-code QuestionType cell (col 16)
  const typeCell = row.getCell(16);
  if (q.QuestionType === 'MSQ') {
    typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
    typeCell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF3730A3' } };
  }
});

// ── Auto-filter on header
ws.autoFilter = { from: 'A1', to: `Q${questions.length + 1}` };

// ── Add an instructions sheet
const instrWs = wb.addWorksheet('📋 Instructions', {
  properties: { tabColor: { argb: 'FF3B82F6' } },
});
instrWs.getColumn(1).width = 20;
instrWs.getColumn(2).width = 70;

const instrData = [
  ['COLUMN',           'DESCRIPTION & RULES'],
  ['Category',         'Main topic area (e.g. "Network Security", "Cryptography"). Required.'],
  ['Area',             'Sub-topic within the category (e.g. "Firewalls", "PKI"). Required.'],
  ['Question',         'Full question text. Required.'],
  ['Option1',          'First answer choice. Required.'],
  ['Option2',          'Second answer choice. Required.'],
  ['Option3',          'Third answer choice. Optional.'],
  ['Option4',          'Fourth answer choice. Optional.'],
  ['CorrectOption1',   'EXACT text of the correct answer (must match one of the options). Required for MCQ.'],
  ['CorrectOption2',   'Second correct answer text — ONLY fill for MSQ (multi-select). Leave blank for MCQ.'],
  ['CorrectOption3',   'Third correct answer — ONLY for MSQ. Leave blank otherwise.'],
  ['CorrectOption4',   'Fourth correct answer — ONLY for MSQ. Leave blank otherwise.'],
  ['Justification1',   'Explanation for the correct answer. Strongly recommended.'],
  ['Justification2-4', 'Additional justifications (optional).'],
  ['QuestionType',     'Must be exactly: MCQ  or  MSQ'],
  ['DifficultyLevel',  'Must be exactly: Easy  or  Medium  or  Hard'],
  ['',                 ''],
  ['NOTES',            ''],
  ['',                 '• Do NOT change column header names.'],
  ['',                 '• CorrectOption values must EXACTLY match the option text (case-sensitive).'],
  ['',                 '• For MCQ: fill only CorrectOption1, leave CorrectOption2-4 blank.'],
  ['',                 '• For MSQ: fill CorrectOption1 and CorrectOption2 (up to 4).'],
  ['',                 '• Save as .xlsx before uploading. Do not save as .xls or .csv.'],
];

instrData.forEach((row, i) => {
  const r = instrWs.addRow(row);
  r.height = 24;
  if (i === 0 || i === 17) {
    r.eachCell(c => {
      c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: i === 0 ? 'FF1D4ED8' : 'FFF1F5F9' } };
      c.font  = { bold: true, color: { argb: i === 0 ? 'FFFFFFFF' : 'FF334155' }, size: 11 };
      c.alignment = { vertical: 'middle' };
    });
  } else {
    r.eachCell(c => {
      c.font = { size: 10, name: 'Calibri' };
      c.alignment = { vertical: 'middle', wrapText: true };
    });
  }
});

// ── Save
const outPath = 'e:/osa-data/PRACTICE_TEST_TEMPLATE.xlsx';
await wb.xlsx.writeFile(outPath);
console.log(`✅ Template created: ${outPath}`);
console.log(`   • ${questions.length} sample questions included`);
console.log(`   • "📋 Instructions" sheet added`);
console.log(`\n📤 Upload this file at: Admin Panel → Upload → Practice Test`);
