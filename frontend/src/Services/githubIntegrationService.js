import api from './api';

// ─── Save GitHub repo URL to a project ───────────────────
export async function saveGithubRepo(projectId, githubRepo) {
    const { data } = await api.patch(`/projects/${projectId}/github`, { githubRepo });
    return data; // { success, githubRepo }
}

// ─── Get branches ────────────────────────────────────────
export async function getBranches(projectId) {
    const { data } = await api.get(`/github-integration/${projectId}/branches`);
    return data; // { success, branches }
}

// ─── Get recent commits ──────────────────────────────────
export async function getCommits(projectId) {
    const { data } = await api.get(`/github-integration/${projectId}/commits`);
    return data; // { success, commits }
}

// ─── Get pull requests ───────────────────────────────────
export async function getPullRequests(projectId) {
    const { data } = await api.get(`/github-integration/${projectId}/pulls`);
    return data; // { success, pulls }
}
