const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.evaluateAnswer = async (question, answer) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
  });

  const prompt = `
You are a strict technical interviewer.

Evaluate the candidate's answer.

GRADING RULES:
- If answer is irrelevant → Score 0-2
- If answer is too short (<15 words) → Max 3
- If partially correct but shallow → 4-6
- If mostly correct with explanation → 7-8
- If technically strong, structured, example-based → 9-10
- If nonsense or random text → Score 0

Question:
${question}

Answer:
${answer}

Respond ONLY in this JSON format:

{
  "score": number,
  "feedback": "short explanation",
  "improvements": "how to improve"
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("AI parsing error:", text);
    return {
      score: 0,
      feedback: "Evaluation failed.",
      improvements: "Try again."
    };
  }
};
