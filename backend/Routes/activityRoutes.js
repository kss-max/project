const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const Activity = require('../Models/Activity');

// GET /api/activities/:projectId — fetch recent activities for a project
router.get('/:projectId', protect, async (req, res) => {
    try {
        const activities = await Activity.find({ project: req.params.projectId })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, activities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
