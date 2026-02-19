const express = require("express");
const router = express.Router();
const { startInterview, submitInterview , getHistory } = require("../controllers/interviewController");
const verifyToken = require('../middleware/authMiddleware');

router.post("/start", verifyToken, startInterview);
router.post("/submit", verifyToken, submitInterview);
router.get("/history", verifyToken, getHistory);

module.exports = router;
