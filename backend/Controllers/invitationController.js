const Invitation = require('../Models/Invitation');
const Project = require('../Models/Project');
const User = require('../Models/User');

// ─── POST /api/invitations ─────────────────────────────────
// Send an invite to a user for a project
exports.sendInvitation = async (req, res) => {
    try {
        const { projectId, receiverId, role } = req.body;

        // 1. Validate required fields
        if (!projectId || !receiverId) {
            return res.status(400).json({ success: false, message: 'projectId and receiverId are required' });
        }

        // 2. Make sure the project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // 3. Make sure receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 4. Prevent inviting yourself
        if (req.user._id.toString() === receiverId) {
            return res.status(400).json({ success: false, message: 'You cannot invite yourself' });
        }

        // 5. Check for duplicate pending invite
        const existing = await Invitation.findOne({
            projectId,
            sender: req.user._id,
            receiver: receiverId,
            status: 'pending',
        });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Invitation already sent to this user' });
        }

        // 6. Create the invitation
        const invitation = await Invitation.create({
            projectId,
            sender: req.user._id,
            receiver: receiverId,
            role: role || 'Member',
            status: 'pending',
        });

        res.status(201).json({ success: true, invitation });

    } catch (error) {
        console.error('Send invitation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/invitations/project/:projectId ───────────────
// Get all invitations sent for a specific project
exports.getProjectInvitations = async (req, res) => {
    try {
        const { projectId } = req.params;

        const invitations = await Invitation.find({ projectId })
            .populate('receiver', 'name email')  // show who was invited
            .populate('sender', 'name')        // show who sent it
            .sort({ createdAt: -1 });            // newest first

        res.json({ success: true, invitations });

    } catch (error) {
        console.error('Get invitations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/invitations/my ────────────────────────────────
// Get all invitations received by the logged-in user
exports.getMyInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ receiver: req.user._id })
            .populate('sender', 'name email')
            .populate('projectId', 'title description techStack')
            .sort({ createdAt: -1 });

        res.json({ success: true, invitations });

    } catch (error) {
        console.error('Get my invitations error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PATCH /api/invitations/:id/respond ─────────────────────
// Accept or reject an invitation
exports.respondToInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accepted' or 'rejected'

        // 1. Validate action
        if (!['accepted', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be "accepted" or "rejected"' });
        }

        // 2. Find the invitation
        const invitation = await Invitation.findById(id);
        if (!invitation) {
            return res.status(404).json({ success: false, message: 'Invitation not found' });
        }

        // 3. Make sure this invitation belongs to the logged-in user
        if (invitation.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'This invitation is not for you' });
        }

        // 4. Make sure it's still pending
        if (invitation.status !== 'pending') {
            return res.status(400).json({ success: false, message: `Invitation already ${invitation.status}` });
        }

        // 5. Update the status
        invitation.status = action;
        await invitation.save();

        // 6. If accepted, add user to the project's teamMembers
        if (action === 'accepted') {
            const userToAdd = invitation.type === 'application' ? invitation.sender : invitation.receiver;

            await Project.findByIdAndUpdate(invitation.projectId, {
                $push: {
                    teamMembers: {
                        user: userToAdd,
                        role: invitation.role || 'Member',
                        joinedAt: new Date(),
                    },
                },
            });
        }

        res.json({ success: true, invitation });

    } catch (error) {
        console.error('Respond to invitation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/invitations/apply ────────────────────────────
// Apply to join a project (bottom-up application)
exports.applyToProject = async (req, res) => {
    try {
        const { projectId, role, message } = req.body;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        if (project.createdBy.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot apply to your own project' });
        }

        // Check if user is already in the team
        const alreadyInTeam = project.teamMembers.some(m => m.user.toString() === req.user._id.toString());
        if (alreadyInTeam) {
            return res.status(400).json({ success: false, message: 'You are already in this project team' });
        }

        // Check if there's any pending invite or application
        const existing = await Invitation.findOne({
            projectId,
            $or: [
                { sender: req.user._id, receiver: project.createdBy }, // pending application
                { sender: project.createdBy, receiver: req.user._id } // pending invitation
            ],
            status: 'pending'
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'A pending application or invitation already exists' });
        }

        const application = await Invitation.create({
            projectId,
            sender: req.user._id,
            receiver: project.createdBy,
            type: 'application',
            role: role || 'Member',
            message: message || '',
            status: 'pending'
        });

        res.status(201).json({ success: true, invitation: application });
    } catch (error) {
        console.error('Apply to project error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
