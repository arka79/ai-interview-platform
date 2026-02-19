const express = require("express");
const router = express.Router();
const sql = require("../db");
const verifyToken = require("../middleware/authMiddleware");

// ✅ Apply middleware here
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const totalResult = await sql`
      SELECT COUNT(*)::int AS total_interviews
      FROM interview_sessions
      WHERE user_id = ${userId} AND completed = TRUE
    `;

    const avgResult = await sql`
      SELECT COALESCE(AVG(total_score), 0)::numeric(10,2) AS average_score
      FROM interview_sessions
      WHERE user_id = ${userId} AND completed = TRUE
    `;

    const bestResult = await sql`
      SELECT COALESCE(MAX(total_score), 0)::int AS best_score
      FROM interview_sessions
      WHERE user_id = ${userId} AND completed = TRUE
    `;

    const startedResult = await sql`
      SELECT COUNT(*)::int AS total_started
      FROM interview_sessions
      WHERE user_id = ${userId}
    `;

    return res.json({
      success: true,
      total_interviews: totalResult[0].total_interviews,
      average_score: Number(avgResult[0].average_score),
      best_score: bestResult[0].best_score,
      completion_rate:
        startedResult[0].total_started > 0
          ? (
              (totalResult[0].total_interviews /
                startedResult[0].total_started) *
              100
            ).toFixed(1)
          : 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({
      message: "Failed to fetch dashboard metrics",
    });
  }
});

module.exports = router;
