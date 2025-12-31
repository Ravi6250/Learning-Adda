import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("🔍 Checking available models for your API Key...");

async function checkModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.log("❌ Error:", data.error.message);
        } else {
            console.log("✅ Available Models:");
            // Sirf 'generateContent' wale models filter karke dikhayenge
            const validModels = data.models
                .filter(m => m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name); // Sirf naam dikhao
            
            console.log(validModels);
        }
    } catch (error) {
        console.log("❌ Network Error:", error.message);
    }
}

checkModels();