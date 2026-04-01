const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const Project = require('../Models/Project');

// Protect routes — verify JWT from cookie or Authorization header
const protect = async (req, res, next) => {
  let token;

  // 1. Check cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 2. Fallback to Authorization header
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized — token invalid' });
  }
};

// Check if user is a member or owner of the project
const isMember = async (req, res, next) => {
  try {
    let projectId = req.params.projectId || req.params.id;
    const taskId = req.params.taskId;

    // If we have a taskId but no projectId, find the task to get the projectId
    if (!projectId && taskId) {
      const Task = require('../Models/Task');
      const task = await Task.findById(taskId);
      if (task) {
        projectId = task.projectId;
      }
    }

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project context is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if creator or in teamMembers array
    const isCreator = project.createdBy.toString() === req.user._id.toString();
    const isTeamMember = project.teamMembers.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isCreator && !isTeamMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied — You are not a member of this project workspace',
      });
    }

    req.project = project; // Attach project for subsequent controllers
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { protect, isMember };
