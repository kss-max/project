const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const {
    getBranches,
    getCommits,
    getPullRequests,
} = require('../Controllers/githubIntegrationController');

// ─── GITHUB INTEGRATION ROUTES (/api/github-integration) ─
router.get('/:projectId/branches', protect, getBranches);
router.get('/:projectId/commits', protect, getCommits);
router.get('/:projectId/pulls', protect, getPullRequests);

module.exports = router;
