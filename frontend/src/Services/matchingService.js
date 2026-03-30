import api from './api';

export async function getProjectMatches(projectId, payload = {}) {
  const { data } = await api.post(`/matching/${projectId}`, payload);
  return data;
}
