import api from './api';

// ─── Ideation Service ───────────────────────────────────

export async function generateIdeas(idea) {
  const { data } = await api.post('/aiideathon/generate', { idea });
  return data;    // { success, projects }
}

// ─── Kaggle Dataset Search ──────────────────────────────

export async function searchKaggleDatasets({ title, description, techStack }) {
  const { data } = await api.post('/kaggle/search', { title, description, techStack });
  return data;    // { success, keywords, datasets }
}

// ─── GitHub Repo Search ─────────────────────────────────

export async function searchGitHubRepos({ title, description, techStack }) {
  const { data } = await api.post('/github/search', { title, description, techStack });
  return data;    // { success, queries, repos }
}
