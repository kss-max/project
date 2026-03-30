import api from './api';

// ─── Project Service ────────────────────────────────────

/**
 * Get all projects (with optional search & filter).
 * params example: { search: 'AI', techStack: 'React,Node', difficulty: 'Intermediate', category: 'AI' }
 */
export async function getProjects(params = {}) {
  const { data } = await api.get('/projects', { params });
  return data;          // { success, count, projects }
}

/** Get recommended projects for the logged-in user */
export async function getRecommendedProjects() {
  const { data } = await api.get('/projects/recommended');
  return data;
}

/** Get single project by ID */
export async function getProjectById(id) {
  const { data } = await api.get(`/projects/${id}`);
  return data;          // { success, project }
}

/** Create a new project */
export async function createProject(projectData) {
  const { data } = await api.post('/projects', projectData);
  return data;          // { success, project }
}

/** Update existing project (only creator) */
export async function updateProject(id, projectData) {
  const { data } = await api.put(`/projects/${id}`, projectData);
  return data;
}

/** Delete a project (only creator) */
export async function deleteProject(id) {
  const { data } = await api.delete(`/projects/${id}`);
  return data;
}