const express = require('express');
const router = express.Router();
const {RegisterUser , LoginUser} = require('../controllers/authController');
// Placeholder for user registration
 const verifyToken = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, async (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user.id
  });
});

 router.post('/register', RegisterUser);
 router.post('/login', LoginUser);

 module.exports = router;
