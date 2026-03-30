const Project = require('../Models/Project');
const User = require('../Models/User');
const Activity = require('../Models/Activity');
const { getTemplateSeed } = require('../Services/templateService');

// ─── CREATE PROJECT ─────────────────────────────────────
exports.createProject = async (req, res) => {
  try {
    const templateSeed = getTemplateSeed(req.body.templateType);

    const projectData = {
      ...req.body,
      createdBy: req.user._id,
      // Automatically add creator as team owner
      teamMembers: [{ user: req.user._id, role: 'Owner' }],
    };

    // When template is selected, initialize seed data for team formation and execution.
    if (templateSeed) {
      projectData.requiredRoles = req.body.requiredRoles?.length
        ? req.body.requiredRoles
        : templateSeed.requiredRoles;
      projectData.starterTasks = req.body.starterTasks?.length
        ? req.body.starterTasks
        : templateSeed.starterTasks;
      projectData.starterMilestones = req.body.starterMilestones?.length
        ? req.body.starterMilestones
        : templateSeed.starterMilestones;
      projectData.techStack = req.body.techStack?.length
        ? req.body.techStack
        : templateSeed.defaultTechStack;
    }

    const project = await Project.create(projectData);
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL PROJECTS (with search & filter) ────────────
exports.getProjects = async (req, res) => {
  try {
    const { search, techStack, difficulty, category, myProjects } = req.query;

    // Build filter object
    const filter = {};

    if (myProjects === 'true') {
      filter.$or = [
        { createdBy: req.user._id },
        { 'teamMembers.user': req.user._id }
      ];
    }

    // Search by title, description, or tech stack (case-insensitive)
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      const searchOr = [
        { title: regex },
        { description: regex },
        { techStack: regex },
      ];
      if (filter.$or) {
        filter.$and = [ { $or: filter.$or }, { $or: searchOr } ];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }

    // Filter by tech stack (find projects that include this tech)
    if (techStack) {
      filter.techStack = { $in: techStack.split(',') };
    }

    // Filter by difficulty
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // Filter by category
    if (category) {
      filter.category = category;
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET RECOMMENDED PROJECTS ───────────────────────────
exports.getRecommendedProjects = async (req, res) => {
  try {
    // 1. Fetch user's profile to get skills and interests
    const user = await User.findById(req.user._id).select('skills interests');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Flatten user skills & interests into an array of lowercase keywords
    let userKeywords = [];
    if (user.skills) {
      Object.keys(user.skills).forEach(category => {
        if (Array.isArray(user.skills[category])) {
          userKeywords.push(...user.skills[category]);
        }
      });
    }
    if (user.interests) {
      userKeywords.push(...user.interests);
    }
    userKeywords = userKeywords.map(k => k.trim().toLowerCase());

    // 3. Fetch open projects where the user is NOT the creator
    const openProjects = await Project.find({
      status: 'open',
      createdBy: { $ne: req.user._id },
    }).populate('createdBy', 'name email avatar');

    // Filter out projects where the user is already a team member
    const availableProjects = openProjects.filter(
      p => !p.teamMembers.some(m => m.user.toString() === req.user._id.toString())
    );

    // 4. Calculate match score for each project
    const scoredProjects = availableProjects.map(project => {
      let projectKeywords = [];
      if (project.techStack) projectKeywords.push(...project.techStack);
      if (project.requiredRoles) projectKeywords.push(...project.requiredRoles);
      if (project.category) projectKeywords.push(project.category);

      projectKeywords = projectKeywords.filter(Boolean).map(k => k.trim().toLowerCase());

      // Count overlap
      let matchCount = 0;
      projectKeywords.forEach(keyword => {
        if (userKeywords.includes(keyword)) matchCount++;
      });

      // Calculate percentage based on how many project requirements the user meets
      let matchPercentage = 0;
      if (projectKeywords.length > 0 && userKeywords.length > 0) {
        matchPercentage = Math.round((matchCount / projectKeywords.length) * 100);
      }
      if (matchPercentage > 100) matchPercentage = 100;

      return {
        ...project.toObject(),
        matchPercentage: matchPercentage > 0 ? `${matchPercentage}% Match` : 'New Pick',
        matchScore: matchPercentage
      };
    });

    // 5. Sort by score descending and take top 5
    scoredProjects.sort((a, b) => b.matchScore - a.matchScore);
    const topRecommendations = scoredProjects.slice(0, 5);

    res.status(200).json({ success: true, projects: topRecommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET SINGLE PROJECT BY ID ───────────────────────────
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email avatar college department')
      .populate('teamMembers.user', 'name email avatar skills');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE PROJECT ─────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Only the creator can update
    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this project' });
    }

    const allowedFields = [
      'title', 'description', 'techStack', 'datasets', 'datasetLinks', 'difficulty',
      'estimatedDuration', 'challenges', 'improvements', 'status', 'category',
      'templateType', 'requiredRoles', 'targetTeamSize', 'starterTasks', 'starterMilestones',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar');

    res.status(200).json({ success: true, project: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE PROJECT ─────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── SAVE GITHUB REPO URL ────────────────────────────────
exports.saveGithubRepo = async (req, res) => {
  try {
    const { githubRepo } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.githubRepo = githubRepo || '';
    await project.save();

    // Log activity
    if (githubRepo) {
      Activity.create({ project: project._id, user: req.user._id, action: 'github_connected', details: `Connected GitHub repo: ${githubRepo}` }).catch(() => {});
    }

    res.json({ success: true, githubRepo: project.githubRepo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADD RESOURCE ────────────────────────────────────────
exports.addResource = async (req, res) => {
  try {
    const { title, url, type } = req.body;
    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.resources.push({ title, url, type: type || 'Other', addedBy: req.user._id });
    await project.save();

    res.status(201).json({ success: true, resources: project.resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE RESOURCE ─────────────────────────────────────
exports.deleteResource = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.resources = project.resources.filter(r => r._id.toString() !== req.params.resourceId);
    await project.save();

    res.json({ success: true, resources: project.resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
