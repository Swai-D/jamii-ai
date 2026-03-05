// lib/api.js — Central API client for JamiiAI
import axios from "axios";
import Cookies from "js-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({ baseURL: BASE });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("jamii_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — redirect to auth
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove("jamii_token");
      if (typeof window !== "undefined") window.location.href = "/auth";
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post("/api/auth/login",    data),
  register: (data) => api.post("/api/auth/register", data),
  me:       ()     => api.get("/api/auth/me"),
  onboard:  (data) => api.patch("/api/auth/onboard", data),
};

// ── USERS ─────────────────────────────────────────────────────────
export const usersAPI = {
  list:   (params) => api.get("/api/users",          { params }),
  get:    (handle) => api.get(`/api/users/${handle}`),
  follow: (id)     => api.post(`/api/users/${id}/follow`),
};

// ── POSTS ─────────────────────────────────────────────────────────
export const postsAPI = {
  list:     (params) => api.get("/api/posts",                    { params }),
  create:   (data)   => api.post("/api/posts",                   data),
  delete:   (id)     => api.delete(`/api/posts/${id}`),
  like:     (id)     => api.post(`/api/posts/${id}/like`),
  bookmark: (id)     => api.post(`/api/posts/${id}/bookmark`),
  comments: (id)     => api.get(`/api/posts/${id}/comments`),
  comment:  (id, data) => api.post(`/api/posts/${id}/comments`,  data),
};

// ── CHALLENGES ────────────────────────────────────────────────────
export const challengesAPI = {
  list:     ()   => api.get("/api/challenges"),
  register: (id) => api.post(`/api/challenges/${id}/register`),
};

// ── RESOURCES ─────────────────────────────────────────────────────
export const resourcesAPI = {
  list:     (params) => api.get("/api/resources", { params }),
  download: (id)     => api.post(`/api/resources/${id}/download`),
};

// ── NEWS ──────────────────────────────────────────────────────────
export const newsAPI = {
  list: (params) => api.get("/api/news", { params }),
};

// ── STARTUPS ──────────────────────────────────────────────────────
export const startupsAPI = {
  list: (params) => api.get("/api/startups", { params }),
};

// ── INSTITUTIONS ──────────────────────────────────────────────────
export const institutionsAPI = {
  list: (params) => api.get("/api/institutions", { params }),
};

// ── EVENTS ────────────────────────────────────────────────────────
export const eventsAPI = {
  list: ()   => api.get("/api/events"),
  rsvp: (id) => api.post(`/api/events/${id}/rsvp`),
};

export default api;
