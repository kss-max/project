const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { getIdea } = require('../Controllers/Aiideathon');

// POST /api/aiideathon/generate  →  generate AI project ideas
router.post('/generate', protect, getIdea);

module.exports = router;
