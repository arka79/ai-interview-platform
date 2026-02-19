const fs = require("fs");
const path = require("path");
const sql = require("../db");
const { evaluateAnswer } = require("../services/aiService"); 
/* =====================================
   START INTERVIEW
===================================== */

const startInterview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { role, difficulty } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!role || !difficulty) {
      return res.status(400).json({
        message: "Role and difficulty are required",
      });
    }

    const filePath = path.join(__dirname, "../data/questions.json");

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        message: "Questions file not found",
      });
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData);

    if (!data[role] || !data[role][difficulty]) {
      return res.status(404).json({
        message: "No questions found",
      });
    }

    const questions = data[role][difficulty].map((q, index) => ({
      id: index + 1,
      question: q,
    }));

    const session = await sql`
      INSERT INTO interview_sessions (user_id, role, difficulty, total_questions)
      VALUES (${userId}, ${role}, ${difficulty}, ${questions.length})
      RETURNING id
    `;

    return res.json({
      success: true,
      sessionId: session[0].id,
      totalQuestions: questions.length,
      questions,
    });

  } catch (error) {
    console.error("Start Interview Error:", error);
    return res.status(500).json({
      message: "Server error while starting interview",
    });
  }
};


/* =====================================
   SUBMIT INTERVIEW
===================================== */
// your Gemini file

const submitInterview = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { answers, sessionId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        message: "Answers must be a non-empty array",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        message: "Session ID required",
      });
    }

    // 🔒 Validate session
    const sessionCheck = await sql`
      SELECT id, completed 
      FROM interview_sessions
      WHERE id = ${sessionId} AND user_id = ${userId}
    `;

    if (sessionCheck.length === 0) {
      return res.status(403).json({ message: "Invalid session" });
    }

    if (sessionCheck[0].completed) {
      return res.status(400).json({
        message: "Interview already submitted",
      });
    }

    let totalScore = 0;
    let details = [];

    // 🔥 Start transaction
    await sql`BEGIN`;

    for (let item of answers) {
      const questionText = item.question;
      const answerText = item.answer;

      if (!questionText || !answerText) continue;

      let evaluation;

      // ✅ Prevent wasting AI tokens on garbage
      if (!answerText || answerText.trim().length < 5) {
        evaluation = {
          score: 0,
          feedback: "Answer is empty or meaningless.",
          improvements: "Provide a valid technical explanation.",
        };
      } else {
        evaluation = await evaluateAnswer(
          questionText,
          answerText
        );
      }

      totalScore += evaluation.score;

      details.push({
        question: questionText,
        score: evaluation.score,
        feedback: evaluation.feedback,
        improvements: evaluation.improvements,
      });

      await sql`
        INSERT INTO interviews
        (user_id, session_id, question, answer, score, feedback, improvements)
        VALUES
        (${userId}, ${sessionId}, ${questionText}, ${answerText},
         ${evaluation.score}, ${evaluation.feedback}, ${evaluation.improvements})
      `;
    }

    const average =
      details.length > 0 ? totalScore / details.length : 0;

    await sql`
      UPDATE interview_sessions
      SET total_score = ${totalScore},
          completed = TRUE
      WHERE id = ${sessionId}
    `;

    await sql`COMMIT`;

    return res.json({
      success: true,
      average: Number(average.toFixed(1)),
      totalScore,
      details,
    });

  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Submit Interview Error:", error);
    return res.status(500).json({
      message: "Server error while submitting interview",
    });
  }
};


/* =====================================
   GET INTERVIEW HISTORY
===================================== */

const getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const history = await sql`
      SELECT id, question, score, feedback, improvements
      FROM interviews
      WHERE user_id = ${userId}
      ORDER BY id DESC
    `;

    // `sql` returns an array of rows. Provide a consistent response shape.
    return res.status(200).json({ questions: history || [] });

  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  startInterview,
  submitInterview,
  getHistory,
};
