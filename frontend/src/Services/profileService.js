import api from './api';

// ─── Profile Service ────────────────────────────────────

export async function getProfile() {
  const { data } = await api.get('/profile');
  return data;
}

export async function updateProfile(profileData) {
  const { data } = await api.put('/profile', profileData);
  return data;
}
