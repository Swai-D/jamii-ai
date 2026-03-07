import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
  stats:       ()    => api.get("/api/admin/stats"),
  users:       (p)   => api.get("/api/admin/users", { params: p }),
  banUser:     (id)  => api.patch(`/api/admin/users/${id}/ban`),
  verifyUser:  (id)  => api.patch(`/api/admin/users/${id}/verify`),
  getSettings: ()    => api.get("/api/admin/settings"),
  saveSettings:(data)=> api.patch("/api/admin/settings", data),
  jobs:        (s)   => api.get("/api/admin/jobs", { params: { status: s } }),
  approveJob:  (id)  => api.patch(`/api/admin/jobs/${id}/approve`),
  featureJob:  (id)  => api.patch(`/api/admin/jobs/${id}/feature`),
  rejectJob:   (id)  => api.delete(`/api/admin/jobs/${id}`),
};

export default api;
