import api from './api';

// ─── Get recent activities for a project ─────────────────
export async function getActivities(projectId) {
    const { data } = await api.get(`/activities/${projectId}`);
    return data; // { success, activities }
}
