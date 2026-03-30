import api from './api';

// ─── Get all tasks for a project ─────────────────────────
export async function getTasks(projectId) {
    const { data } = await api.get(`/tasks/${projectId}`);
    return data; // { success, tasks }
}

// ─── Create a single manual task ─────────────────────────
export async function createTask(payload) {
    const { data } = await api.post('/tasks', payload);
    return data; // { success, task }
}

// ─── Update a task (status, assignee, title, etc) ────────
export async function updateTask(taskId, updates) {
    const { data } = await api.patch(`/tasks/${taskId}`, updates);
    return data; // { success, task }
}

// ─── Delete a task ───────────────────────────────────────
export async function deleteTask(taskId) {
    const { data } = await api.delete(`/tasks/${taskId}`);
    return data; // { success, message }
}

// ─── AI Breakdown: auto-generate tasks for a project ─────
export async function generateAITasks(projectId) {
    const { data } = await api.post(`/tasks/${projectId}/ai-breakdown`);
    return data; // { success, tasks }
}

// ─── Add comment to task ─────────────────────────────────
export async function addComment(taskId, text) {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
    return data; // { success, comment }
}
