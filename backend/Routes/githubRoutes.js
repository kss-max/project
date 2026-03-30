const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { getGithubRepos } = require('../Controllers/githubContoller');

// POST /api/github/search  →  search similar projects on GitHub
router.post('/search', protect, getGithubRepos);

module.exports = router;