const sql = require("../db");
const { generateQuestion, evaluateAnswer } = require("../services/aiService");

/* ==========================================
   START INTERVIEW (Generate 5 Questions)
========================================== */

const startInterview = async (req, res) => {
  const { role, difficulty } = req.body;
  const userId = req.user.id;

  try {
    // Create session
    const session = await sql`
      INSERT INTO interview_sessions (user_id, role, difficulty)
      VALUES (${userId}, ${role}, ${difficulty})
      RETURNING *
    `;

    const sessionId = session[0].id;

    // ONE AI call → Generate 5 questions
    const prompt = `
You are a senior technical interviewer.

Generate 5 ${difficulty} level interview questions 
for a ${role} role.

Return STRICT JSON:

{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3",
    "Question 4",
    "Question 5"
  ]
}
`;

    const aiResponse = await generateQuestion(prompt);
    const parsed = JSON.parse(aiResponse);

    res.json({
      sessionId,
      questions: parsed.questions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start interview" });
  }
};


/* ==========================================
   SUBMIT ENTIRE INTERVIEW (Single AI Call)
========================================== */

const submitInterview = async (req, res) => {
  const { sessionId, questions, answers } = req.body;
  const userId = req.user.id;

  try {
    const prompt = `
You are a senior technical interviewer.

Evaluate the following interview answers.

Return STRICT JSON:

{
  "averageScore": number,
  "results": [
    {
      "question": "...",
      "score": number,
      "feedback": "...",
      "improvements": "..."
    }
  ]
}

Interview Data:
${questions.map((q, i) => `
Question: ${q}
Answer: ${answers[i] || "No answer"}
`).join("\n")}
`;

    // ONE AI call → Evaluate everything
    const aiResponse = await evaluateAnswer(prompt);
    const parsed = JSON.parse(aiResponse);

    // Save each question result
    for (let i = 0; i < parsed.results.length; i++) {
      const item = parsed.results[i];

      await sql`
        INSERT INTO interviews
        (user_id, session_id, question, answer, score, feedback, improvements)
        VALUES
        (
          ${userId},
          ${sessionId},
          ${item.question},
          ${answers[i] || ""},
          ${item.score},
          ${item.feedback},
          ${item.improvements}
        )
      `;
    }

    // Update session summary
    await sql`
      UPDATE interview_sessions
      SET total_score = ${parsed.averageScore},
          total_questions = ${parsed.results.length},
          completed = TRUE
      WHERE id = ${sessionId}
    `;

    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submission failed" });
  }
};


/* ==========================================
   GET HISTORY
========================================== */
const getHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const questions = await sql`
      SELECT id, question, score, feedback, improvements, created_at
      FROM interviews
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    res.json({
      total_questions: questions.length,
      questions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch history" });
  }
};

module.exports = {
  startInterview,
  submitInterview,
  getHistory
};