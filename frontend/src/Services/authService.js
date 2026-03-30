import api from './api';

// ─── Auth Service ───────────────────────────────────────

export async function signupUser({ name, email, password, college, department, yearOfStudy }) {
  const { data } = await api.post('/auth/signup', { name, email, password, college, department, yearOfStudy });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function logoutUser() {
  const { data } = await api.post('/auth/logout');
  return data;
}
