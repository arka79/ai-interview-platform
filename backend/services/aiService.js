const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_NAME = "gemini-3-flash-preview"; // Use the latest available Gemini model

/* ===============================
   INTERNAL HELPER
================================= */

const callGemini = async (prompt) => {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
  });

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  // Remove ```json ``` wrappers if Gemini adds them
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return cleaned;
};

/* ===============================
   GENERATE QUESTIONS
================================= */

const generateQuestion = async (prompt) => {
  try {
    const text = await callGemini(prompt);

    return text; // Controller handles JSON.parse

  } catch (err) {
    console.error("Gemini Question Error:", err);
    throw new Error("AI question generation failed");
  }
};

/* ===============================
   EVALUATE ANSWERS
================================= */

const evaluateAnswer = async (prompt) => {
  try {
    const text = await callGemini(prompt);

    return text; // Controller handles JSON.parse

  } catch (err) {
    console.error("Gemini Evaluation Error:", err);
    throw new Error("AI evaluation failed");
  }
};

module.exports = {
  generateQuestion,
  evaluateAnswer,
};