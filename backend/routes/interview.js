const express = require("express");
const router = express.Router();
const {
  startInterview,
  submitInterview,
  getHistory
} = require("../controllers/interviewController");

const authMiddleware = require("../middleware/authMiddleware"); // if you use auth

// Single question mode
router.post("/start", authMiddleware, startInterview);
router.post("/submit", authMiddleware, submitInterview);



// History
router.get("/history", authMiddleware, getHistory);

module.exports = router;