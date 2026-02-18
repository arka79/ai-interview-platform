// routes/dashboard.js
const express = require("express");
const router = express.Router();
const sql = require("../db"); // your Postgres client

router.get("/", async (req, res) => {
  const userId = req.user.id; // Assuming auth middleware sets req.user

  try {
    // Total interviews
    const totalResult = await sql`
      SELECT COUNT(*)::int AS total_interviews
      FROM interview_sessions
      WHERE user_id = ${userId}
    `;

    // Average score across all interviews
    const avgResult = await sql`
      SELECT AVG(score)::numeric(5,2) AS average_score
      FROM interviews
      WHERE user_id = ${userId}
    `;

    // Best score
    const bestResult = await sql`
      SELECT MAX(score)::int AS best_score
      FROM interviews
      WHERE user_id = ${userId}
    `;

    res.json({
      total_interviews: totalResult[0].total_interviews || 0,
      average_score: Number(avgResult[0].average_score) || 0,
      best_score: bestResult[0].best_score || 0,
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard metrics" });
  }
});

module.exports = router;