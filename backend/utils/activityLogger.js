const Activity = require('../Models/Activity');

/**
 * Logs an activity to the database and broadcasts it via Socket.io
 * @param {Object} req - The Express request object (must contain req.user and req.app)
 * @param {String|ObjectId} projectId - The ID of the project where the activity occurred
 * @param {String} action - The action type (e.g., 'task_created', 'member_joined')
 * @param {String} details - Human-readable description of the activity
 */
exports.logActivity = async (req, projectId, action, details) => {
    try {
        if (!req.user || !req.user._id) return;

        // 1. Save to Database
        let activity = await Activity.create({
            project: projectId,
            user: req.user._id,
            action,
            details
        });

        // 2. Populate user fields for frontend display
        activity = await activity.populate('user', 'name email avatar');

        // 3. Broadcast to everyone currently viewing the project
        const io = req.app.get('io');
        if (io) {
            const roomName = `project_${projectId.toString()}`;
            io.to(roomName).emit('new_activity', activity);
        }

        return activity;
    } catch (err) {
        console.error('Activity Logging Error:', err.message);
    }
};
