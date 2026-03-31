const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getPublicProfile } = require('../Controllers/profileController');
const { protect } = require('../Middleware/auth');

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);
router.get('/:userId', protect, getPublicProfile);

module.exports = router;
