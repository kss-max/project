const express = require('express');
const router = express.Router();

const { protect } = require('../Middleware/auth');
const { getProjectMatches } = require('../Controllers/matchingController');

// POST /api/matching/:projectId
router.post('/:projectId', protect, getProjectMatches);

module.exports = router;
