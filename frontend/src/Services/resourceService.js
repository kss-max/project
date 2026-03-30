import api from './api';

// ─── Add a resource to a project ─────────────────────────
export async function addResource(projectId, resource) {
    const { data } = await api.post(`/projects/${projectId}/resources`, resource);
    return data; // { success, resources }
}

// ─── Delete a resource from a project ────────────────────
export async function deleteResource(projectId, resourceId) {
    const { data } = await api.delete(`/projects/${projectId}/resources/${resourceId}`);
    return data; // { success, resources }
}
