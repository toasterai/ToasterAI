import axios from 'axios';
import { auth } from '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
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
