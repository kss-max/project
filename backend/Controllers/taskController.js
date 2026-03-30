const Task = require('../Models/Task');
const Project = require('../Models/Project');
const Activity = require('../Models/Activity');
const axios = require('axios');

// ─── CRUD OPERATIONS ─────────────────────────────────────

// Get all tasks for a specific project
exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await Task.find({ projectId })
            .populate('assignee', 'name email')
            .populate('createdBy', 'name')
            .populate('comments.user', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a single manual task
exports.createTask = async (req, res) => {
    try {
        const { projectId, title, description, status, assignee } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Task title is required' });
        }

        let task = await Task.create({
            projectId,
            title,
            description,
            status: status || 'todo',
            assignee: assignee || null,
            createdBy: req.user._id
        });

        // Populate newly created task fields before returning
        task = await task.populate('assignee', 'name email');
        task = await task.populate('createdBy', 'name');
        task = await task.populate('comments.user', 'name');

        // Log activity
        Activity.create({ project: projectId, user: req.user._id, action: 'task_created', details: `Created task "${title}"` }).catch(() => {});

        res.status(201).json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update task status (and/or assignee, title, description)
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const oldStatus = task.status;
        const oldAssignee = task.assignee;

        // Apply updates
        Object.assign(task, req.body);
        await task.save();
        await task.populate('assignee', 'name email');
        await task.populate('createdBy', 'name');
        await task.populate('comments.user', 'name');

        // Log move activity
        if (req.body.status && req.body.status !== oldStatus) {
            const statusLabels = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done' };
            Activity.create({ project: task.projectId, user: req.user._id, action: 'task_moved', details: `Moved "${task.title}" to ${statusLabels[req.body.status] || req.body.status}` }).catch(() => {});
        }

        // Log assign activity
        if (req.body.assignee !== undefined && String(req.body.assignee) !== String(oldAssignee)) {
            const name = task.assignee?.name || 'Unassigned';
            Activity.create({ project: task.projectId, user: req.user._id, action: 'task_assigned', details: `Assigned "${task.title}" to ${name}` }).catch(() => {});
        }

        res.json({ success: true, task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findByIdAndDelete(taskId);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Log activity
        Activity.create({ project: task.projectId, user: req.user._id, action: 'task_deleted', details: `Deleted task "${task.title}"` }).catch(() => {});

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── AI TASK GENERATION ──────────────────────────────────

exports.generateAITasks = async (req, res) => {
    try {
        const { projectId } = req.params;

        // 1. Fetch the project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // 2. Build the prompt
        const prompt = `You are an expert technical project manager. 
A team is building a new project. Break down the project into a list of 5 to 8 actionable milestones or core tasks.

=== PROJECT DETAILS ===
Title: ${project.title}
Description: ${project.description}
Tech Stack: ${(project.techStack || []).join(', ')}

=== INSTRUCTIONS ===
Generate 5 to 8 broad tasks to complete this project from start to finish.
Return a JSON array of objects. Each object must exactly have:
- title (string: short, actionable task name)
- description (string: 1-2 sentences explaining what needs to be done)

Return ONLY valid JSON. No markdown wrappers, no explanation, no formatting.`;

        // 3. Call Groq API (using same config as your Aiideathon.js)
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        // 4. Parse response
        let text = groqRes.data.choices[0].message.content;
        let cleaned = text.trim();
        if (cleaned.startsWith('\`\`\`')) {
            cleaned = cleaned.replace(/^\`\`\`(json)?\n?/, '').replace(/\n?\`\`\`$/, '');
        }

        const taskList = JSON.parse(cleaned);

        // 5. Bulk insert tasks into MongoDB (defaulting status to 'todo')
        const tasksToInsert = taskList.map(t => ({
            projectId: project._id,
            title: t.title,
            description: t.description,
            status: 'todo',
            createdBy: req.user._id, // the owner/admin who clicked the button
        }));

        const insertedTasks = await Task.insertMany(tasksToInsert);

        // Log activity
        Activity.create({ project: project._id, user: req.user._id, action: 'ai_breakdown', details: `AI generated ${insertedTasks.length} tasks` }).catch(() => {});

        res.status(201).json({ success: true, tasks: insertedTasks });

    } catch (error) {
        console.error('AI Task Gen Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to generate AI tasks. Please try again.' });
    }
};

// ─── ADD COMMENT ─────────────────────────────────────────

exports.addComment = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Comment text is required' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const newComment = {
            text,
            user: req.user._id
        };

        task.comments.push(newComment);
        await task.save();

        // Populate the user field for the newly added comment before broadcasting
        await task.populate('comments.user', 'name');

        const populatedComment = task.comments[task.comments.length - 1];

        // Emit through socket.io to anyone in the task room
        const io = req.app.get('io');
        if (io) {
            io.to(taskId).emit('new_comment', {
                taskId,
                comment: populatedComment
            });
        }

        res.status(201).json({ success: true, comment: populatedComment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
