import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('toasterai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear token and redirect
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('toasterai_token');
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export async function register(email, password) {
  const { data } = await api.post('/auth/register', { email, password });
  localStorage.setItem('toasterai_token', data.token);
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('toasterai_token', data.token);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export function logout() {
  localStorage.removeItem('toasterai_token');
}

// --- Scan ---
export async function scanSingle(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await api.post('/scan/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function scanGallery(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('images', file));
  const { data } = await api.post('/scan/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function scanUrl(url) {
  const { data } = await api.post('/scan/url', { url });
  return data;
}

export async function getScanHistory(page = 1, limit = 20) {
  const { data } = await api.get(`/scan/history?page=${page}&limit=${limit}`);
  return data;
}

export async function getScan(id) {
  const { data } = await api.get(`/scan/${id}`);
  return data;
}

// --- Feedback ---
export async function submitFeedback(scanId, feedback) {
  const { data } = await api.post(`/feedback/${scanId}`, feedback);
  return data;
}

export default api;
