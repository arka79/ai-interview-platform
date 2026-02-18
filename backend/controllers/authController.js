const bcrypt = require('bcrypt');
const sql = require('../db');
const jwt = require('jsonwebtoken');
const RegisterUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id, name, email;
    `;

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
const LoginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (user.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // 🔐 Generate JWT Token
    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
module.exports = { RegisterUser, LoginUser };

