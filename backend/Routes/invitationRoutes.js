const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const {
    sendInvitation,
    getProjectInvitations,
    getMyInvitations,
    respondToInvitation,
    applyToProject,
} = require('../Controllers/invitationController');

// POST   /api/invitations                    → send an invite
router.post('/', protect, sendInvitation);

// POST   /api/invitations/apply              → student applying to project
router.post('/apply', protect, applyToProject);

// GET    /api/invitations/my                 → get invitations received by me
router.get('/my', protect, getMyInvitations);

// PATCH  /api/invitations/:id/respond        → accept or reject an invitation
router.patch('/:id/respond', protect, respondToInvitation);

// GET    /api/invitations/project/:projectId → get all invites for a project
router.get('/project/:projectId', protect, getProjectInvitations);

module.exports = router;
