const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
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
router.get('/:projectId', protect, getTasks);

// Create a single manual task
router.post('/', protect, createTask);

// Auto-generate AI tasks for a project
router.post('/:projectId/ai-breakdown', protect, generateAITasks);

// Update a task (status, assignee, etc)
router.patch('/:taskId', protect, updateTask);

// Delete a task
router.delete('/:taskId', protect, deleteTask);

// Add a comment to a task
router.post('/:taskId/comments', protect, addComment);

module.exports = router;
