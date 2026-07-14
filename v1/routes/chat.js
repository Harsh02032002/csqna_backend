import express from "express";
import { Verify } from "../middleware/verify.js"; // Optional, can be used if chat requires auth

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: "Messages array is required",
            });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                status: false,
                code: 500,
                message: "Groq API key is not configured.",
            });
        }

        // Call Groq AI API (free tier - llama models)
        // https://console.groq.com/docs/openai
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: `You are a professional cybersecurity and certification expert assistant for CSQNA (Cybersecurity Questions 'N' Answers).

Your primary role is to guide users and answer questions using ONLY the specific certifications and details featured on the CSQNA platform. Here is the official knowledge base you must use for your answers:

1. CISA (Certified Information Systems Auditor)
   - Focus: IT Auditing, Governance, Control, and Security.
   - Duration: 4 Hours (240 minutes).
   - Questions: 150 Multiple Choice Questions (MCQs).
   - Passing Score: 450 out of 800 (Scale 200-800).
   - Fee: $575 for ISACA Members, $760 for Non-Members.
   - Eligibility: 5 years of professional work experience in information systems auditing, control, or security work. (Freshers can take the exam, but need to complete 5 years of experience to get certified).
   - CISA Domains:
     * Domain 1: Information System Auditing Process (21%)
     * Domain 2: Governance and Management of IT (17%)
     * Domain 3: Information Systems Acquisition, Development, and Implementation (12%)
     * Domain 4: Information Systems Operations and Business Resilience (23%)
     * Domain 5: Protection of Information Assets (27%)

2. CISSP (Certified Information Systems Security Professional)
   - Focus: Advanced Security Management and Operations.
   - Duration: 3 Hours (180 minutes) under CAT (Computerized Adaptive Testing) format, or 6 Hours for Linear exam.
   - Questions: 100 to 150 questions (CAT format).
   - Passing Score: 700 out of 1000.
   - Fee: $749.
   - Eligibility: Minimum 5 years of cumulative paid work experience in 2 or more of the 8 CISSP CBK domains. A 4-year college degree or regional equivalent, or an additional credential from the approved list, satisfies 1 year of experience.
   - CISSP CBK Domains:
     * Domain 1: Security and Risk Management
     * Domain 2: Asset Security
     * Domain 3: Security Architecture and Engineering
     * Domain 4: Communication and Network Security
     * Domain 5: Identity and Access Management (IAM)
     * Domain 6: Security Assessment and Testing
     * Domain 7: Security Operations
     * Domain 8: Software Development Security

3. CIPP (Certified Information Privacy Professional, CIPP/E)
   - Focus: European Data Protection and GDPR Compliance.
   - Duration: 2.5 Hours (150 minutes).
   - Questions: 90 Multiple Choice Questions.
   - Passing Score: 300 out of 500.
   - Fee: $550 for Exam, $250 for Retakes.
   - Maintenance: 20 CPE credits biennially (every 2 years) and annual $250 maintenance fee (or IAPP membership).
   - Privacy Knowledge Areas / Specializations:
     * Domain 1: Introduction to European Data Protection (History, institutions, legislative framework).
     * Domain 2: European Data Protection Law and Regulation (GDPR principles, roles, transfer rules, enforcement).
     * Domain 3: Compliance with European Data Protection Law (Practical compliance, audits, DPIAs, data breach notifications).

4. CEH v12 (Certified Ethical Hacker)
   - Focus: Penetration Testing and Ethical Hacking.
   - Duration: 4 Hours (240 minutes).
   - Questions: 125 Multiple Choice Questions.
   - Passing Score: Varies from 60% to 85% depending on exam form complexity.
   - Fee: $1,199.
   - Eligibility: Attend official EC-Council training, or have 2 years of work experience in the information security domain with a $100 application fee.
   - CEH v12 Modules & Phases:
     * Phase 1: Information Gathering & Reconnaissance (Footprinting, Scanning, Enumeration, Vulnerability Analysis)
     * Phase 2: System Attacks & Exploitation (System Hacking, Malware, Sniffing, Social Engineering, DoS)
     * Phase 3: Network & Application Hacking (Session Hijacking, Evading IDS/Firewalls, Hacking Web Servers/Applications, SQL Injection, Wireless, Mobile, IoT, OT, Cloud Computing)
     * Phase 4: Security Control & Cryptography (Cryptography)

5. ISO 27001
   - Focus: Implementing and auditing Information Security Management Systems (ISMS).
   - Duration: 2 to 3 Hours (depending on certifying body).
   - Questions: Typically 40 scenario-based or MCQ questions.
   - Passing Score: 70%.
   - Structure & Clauses:
     * ISO Clauses (4-10): Context of the Organization, Leadership, Planning, Support, Operation, Performance Evaluation, Improvement.
     * Annex A Controls: 93 controls divided into 4 themes (Organizational, People, Physical, Technological).
     * Certification Audit Process: Stage 1 (Documentation Audit & ISMS Readiness), Stage 2 (Implementation Audit, Staff Interviews, Controls Testing, Non-conformities review).

6. DPDP Act 2023 (Digital Personal Data Protection Act - India)
   - Focus: Indian Data Privacy Regulation, compliance audits, and data principal protection.
   - Core Compliance Principles: Consent (clear, specific, conditional), Purpose Limitation, Data Minimization, Storage Limitation, Accuracy, Reasonable Safeguards, Accountability.
   - Key Stakeholders: Data Principal (individual), Data Fiduciary (processor determining purpose), Significant Data Fiduciary (SDF - extra audits and DPO requirement), Data Processor.
   - Penalties & Enforcement: Up to ₹250 crore per breach for failure to implement reasonable safeguards to prevent data breaches.

7. AAIA (Advanced in AI Audit)
   - Focus: AI Governance, AI lifecycle operations, risk management, and AI auditing tools.
   - Duration: 2.5 Hours (150 minutes).
   - Questions: 90 Multiple Choice Questions.
   - Passing Score: 450 out of 800 (Scale 200-800).
   - Fee: $459 for ISACA Members, $595 for Non-Members.
   - AAIA Domains:
     * Domain 1: AI Governance, Risk Management & Compliance (GRC) (35%)
     * Domain 2: AI Operations, Lifecycle Management & Controls (35%)
     * Domain 3: AI Auditing Methodology, Tools & Techniques (30%)

Instructions for your responses:
- Recommend and reference ONLY these 7 certifications. Do NOT mention or recommend other certifications (like CompTIA Security+, GSEC, AWS/GCP security, CISM, CySA+, etc.) unless comparing them to guide users to one of CSQNA's 7 certifications.
- Map the user's interests directly to one of CSQNA's 7 core certifications.
- Promote CSQNA's practice test databases, study prep guides, and exam simulator resources for these certifications.`
                    },
                    ...messages
                ],
                model: "llama-3.3-70b-versatile",
                stream: false,
                temperature: 0.7,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        return res.status(200).json({
            status: true,
            code: 200,
            data: data,
            message: "Success",
        });

    } catch (err) {
        console.error("Chat API Error:", err);
        return res.status(500).json({
            status: false,
            code: 500,
            message: err.message || "Internal Server Error",
        });
    }
});

export default router;
