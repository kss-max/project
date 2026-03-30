const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getRecommendedProjects,
  getProjectById,
  updateProject,
  deleteProject,
  saveGithubRepo,
  addResource,
  deleteResource,
} = require('../Controllers/projectController');
const { protect } = require('../Middleware/auth');

// All routes require authentication
router.post('/', protect, createProject);
router.get('/', protect, getProjects);
router.get('/recommended', protect, getRecommendedProjects);
router.get('/:id', protect, getProjectById);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.patch('/:id/github', protect, saveGithubRepo);
router.post('/:id/resources', protect, addResource);
router.delete('/:id/resources/:resourceId', protect, deleteResource);

module.exports = router;
