const express = require('express');
const router = express.Router();
const { protect, isMember } = require('../Middleware/auth');
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    generateAITasks,
    addComment
} = require('../Controllers/taskController');

// ─── TASK ROUTES (/api/tasks) ─────────────────────────────

// Get all tasks for a project
router.get('/:projectId', protect, isMember, getTasks);

// Create a single manual task
router.post('/', protect, createTask); // Special handling in controller usually

// Auto-generate AI tasks for a project
router.post('/:projectId/ai-breakdown', protect, isMember, generateAITasks);

// Update a task (status, assignee, etc)
router.patch('/:taskId', protect, isMember, updateTask);

// Delete a task
router.delete('/:taskId', protect, isMember, deleteTask);

// Add a comment to a task
router.post('/:taskId/comments', protect, isMember, addComment);

module.exports = router;
