import axios from "axios";

export const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('admin_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const authAPI = {
  login: (data) => api.post("/api/auth/login", data),
  me:    ()     => api.get("/api/auth/me"),
};

export const adminAPI = {
  // Stats & Dashboard
  stats:                  ()        => api.get("/api/admin/stats"),
  analytics:              (range)   => api.get("/api/admin/analytics", { params: { range: range || "wiki" } }),

  // Users
  users:                  (p)       => api.get("/api/admin/users", { params: p }),
  userDetail:             (id)      => api.get(`/api/users/${id}`),
  banUser:                (id)      => api.patch(`/api/admin/users/${id}/ban`),
  verifyUser:             (id)      => api.patch(`/api/admin/users/${id}/verify`),

  // Settings
  getSettings:            ()        => api.get("/api/admin/settings"),
  saveSettings:           (data)    => api.patch("/api/admin/settings", data),

  // Jobs
  jobs:                   (s)       => api.get("/api/admin/jobs", { params: { status: s } }),
  approveJob:             (id)      => api.patch(`/api/admin/jobs/${id}/approve`),
  featureJob:             (id)      => api.patch(`/api/admin/jobs/${id}/feature`),
  rejectJob:              (id)      => api.delete(`/api/admin/jobs/${id}`),

  // Content Moderation
  flaggedContent:         (p)       => api.get("/api/admin/flagged", { params: p }),
  deleteContent:          (id)      => api.delete(`/api/admin/posts/${id}`),
  approveContent:         (id)      => api.patch(`/api/admin/posts/${id}/approve`),

  // Challenges
  challenges:             ()        => api.get("/api/admin/challenges"),
  createChallenge:        (data)    => api.post("/api/admin/challenges", data),
  fetchChallenges:        ()        => api.post("/api/admin/challenges/fetch"),
  updateChallengeStatus:  (id, s)   => api.patch(`/api/admin/challenges/${id}/status`, { status: s }),
  deleteChallenge:        (id)      => api.delete(`/api/admin/challenges/${id}`),

  // Events
  events:                 ()        => api.get("/api/events"),
  createEvent:            (data)    => api.post("/api/admin/events", data),
  publishEvent:           (id)      => api.patch(`/api/admin/events/${id}/publish`),
  deleteEvent:            (id)      => api.delete(`/api/admin/events/${id}`),

  // Resources
  resources:              (p)       => api.get("/api/admin/resources", { params: p }),
  createResource:         (data)    => api.post("/api/admin/resources", data),
  updateResource:         (id, data)=> api.patch(`/api/admin/resources/${id}/update`, data),
  approveResource:        (id)      => api.patch(`/api/admin/resources/${id}/approve`),
  deleteResource:         (id)      => api.delete(`/api/admin/resources/${id}`),

  // Announcements
  getAnnouncements:       ()        => api.get("/api/admin/announcements"),
  sendAnnouncement:       (data)    => api.post("/api/admin/announcements", data),

  // News
  news:                   (s)       => api.get("/api/admin/news", { params: { status: s } }),
  publishNews:            (id)      => api.patch(`/api/admin/news/${id}/publish`),
  deleteNews:             (id)      => api.delete(`/api/admin/news/${id}`),
  createNews:             (data)    => api.post("/api/admin/news", data),

  // Billing
  billing:                ()        => api.get("/api/admin/billing"),

  // Apify
  runApify:               ()        => api.post("/api/admin/apify/run"),

  // Roles & Permissions
  getRoles:              ()        => api.get("/api/admin/roles"),
  getRole:                (id)      => api.get(`/api/admin/roles/${id}`),
  createRole:             (data)    => api.post("/api/admin/roles", data),
  updateRole:             (id, data)=> api.patch(`/api/admin/roles/${id}`, data),
  deleteRole:             (id)      => api.delete(`/api/admin/roles/${id}`),
  assignRole:             (roleId, data) => api.post(`/api/admin/roles/${roleId}/assign`, data),
  removeRoleFromUser:     (roleId, userId) => api.delete(`/api/admin/roles/${roleId}/users/${userId}`),
  getUsersWithRoles:      ()        => api.get("/api/admin/users/roles"),
};

export default api;