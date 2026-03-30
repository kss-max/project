import api from './api';

// ─── Send an invitation ──────────────────────────────────
// payload: { projectId, receiverId, role }
export async function sendInvitation(payload) {
    const { data } = await api.post('/invitations', payload);
    return data; // { success, invitation }
}

// ─── Get all invitations for a project ──────────────────
export async function getProjectInvitations(projectId) {
    const { data } = await api.get(`/invitations/project/${projectId}`);
    return data; // { success, invitations }
}

// ─── Get all invitations received by the logged-in user ──
export async function getMyInvitations() {
    const { data } = await api.get('/invitations/my');
    return data; // { success, invitations }
}

// ─── Accept or reject an invitation ─────────────────────
// action: 'accepted' or 'rejected'
export async function respondToInvitation(id, action) {
    const { data } = await api.patch(`/invitations/${id}/respond`, { action });
    return data; // { success, invitation }
}

// ─── Apply to join a project (bottom-up application) ─────
export async function applyToProject(projectId, role, message) {
    const { data } = await api.post('/invitations/apply', { projectId, role, message });
    return data; // { success, invitation }
}
