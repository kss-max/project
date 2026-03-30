const express = require('express');
const router = express.Router();

const { signup, login, getMe, logout } = require('../Controllers/authController');
const { protect } = require('../Middleware/auth');

// ─── Manual Validation ───────────────────────────────────

// Signup validation
const signupValidation = (req, res, next) => {
  const { name, email, password, college, department, yearOfStudy } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Full name is required" });
  }

  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Enter a valid email" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  if (!college || college.trim() === "") {
    return res.status(400).json({ message: "College / University is required" });
  }

  if (!department || department.trim() === "") {
    return res.status(400).json({ message: "Department / Branch is required" });
  }

  if (!yearOfStudy || yearOfStudy < 1 || yearOfStudy > 5) {
    return res.status(400).json({ message: "Year of study must be between 1 and 5" });
  }

  next();
};

// Login validation
const loginValidation = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Enter a valid email" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  next();
};

// ─── Routes ─────────────────────────────────────────────

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;