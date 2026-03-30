const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { searchDatasets } = require('../Controllers/kaggleController');

// POST /api/kaggle/search  →  AI keyword extraction + Kaggle dataset search
router.post('/search', protect, searchDatasets);

module.exports = router;
