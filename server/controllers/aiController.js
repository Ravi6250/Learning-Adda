import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Feature: AI Quiz Generator
export const generateQuiz = async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.json({ success: false, message: 'Topic is required' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using your specific model
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are a strict teacher. Create a quiz of 5 multiple-choice questions (MCQs) on the topic: "${topic}".
        
        The output MUST be a valid JSON object.
        Do not add any markdown formatting (like \`\`\`json). Just return the raw JSON.
        
        The structure should look strictly like this:
        [
            {
                "question": "Question text here",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": "Option A"
            }
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Safai logic (Clean Markdown)
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const quizData = JSON.parse(cleanText);

        res.json({ success: true, quizData });

    } catch (error) {
        console.error("Quiz AI Error:", error);
        res.json({ success: false, message: "Failed to generate quiz." });
    }
};

// 2. Feature: AI Note Summarizer
export const generateSummary = async (req, res) => {
    try {
        const { lectureTitle, lectureDescription } = req.body;

        if (!lectureTitle) {
            return res.json({ success: false, message: 'Lecture title is required' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        You are an expert student. Create short, easy-to-read bullet-point study notes for a lecture titled: "${lectureTitle}".
        Context/Description: "${lectureDescription || lectureTitle}"
        
        IMPORTANT: Return ONLY valid JSON. No introductory text, no markdown, no backticks.
        
        Structure:
        {
            "summaryTitle": "Key Takeaways",
            "points": [
                "Point 1",
                "Point 2",
                "Point 3"
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // --- DEBUGGING: Terminal me dekho AI ne kya bheja ---
        console.log("AI Raw Response:", text); 

        // --- SMART CLEANING LOGIC ---
        // Hum text me pehla '{' aur aakhiri '}' dhundhenge
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;

        if (jsonStart === -1 || jsonEnd === -1) {
             throw new Error("Valid JSON not found in response");
        }

        const cleanText = text.substring(jsonStart, jsonEnd); // Sirf JSON wala hissa kato
        
        const summaryData = JSON.parse(cleanText);

        res.json({ success: true, summaryData });

    } catch (error) {
        console.error("Summary AI Error:", error);
        res.status(500).json({ success: false, message: "Failed to generate summary. AI sent invalid format." });
    }
};