// ── AXIOS SETUP (msingi) ───────────────────────────────────────
import axios from "axios";

// Railway uses process.env.VITE_API_URL or similar, but for local we use 4000
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem('token');
}

const api = axios.create({ baseURL: BASE });
api.interceptors.request.use(cfg => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// ── EXPORT zote ───────────────────────────────────────────────────
export const authAPI = {
  login:    data => api.post("/api/auth/login",   data),
  register: data => api.post("/api/auth/register",data),
  me:       ()   => api.get("/api/auth/me"),
  onboard:  data => api.patch("/api/auth/onboard",data),
};

export const postsAPI = {
  list:     (p)  => api.get("/api/posts",        { params:p }),
  create:   data => api.post("/api/posts",        data),
  delete:   id   => api.delete(`/api/posts/${id}`),
  like:     id   => api.post(`/api/posts/${id}/like`),
  bookmark: id   => api.post(`/api/posts/${id}/bookmark`),
  comments: id   => api.get(`/api/posts/${id}/comments`),
  comment:  (id,data) => api.post(`/api/posts/${id}/comments`, data),
};

export const usersAPI = {
  list:        p    => api.get("/api/users",            { params:p }),
  profile:     handle => api.get(`/api/users/${handle}`),
  follow:      id   => api.post(`/api/users/${id}/follow`),
  followers:   id   => api.get(`/api/users/${id}/followers`),
  following:   id   => api.get(`/api/users/${id}/following`),
  suggestions: ()   => api.get("/api/users/suggestions"),
};

export const notificationsAPI = {
  list:    ()  => api.get("/api/notifications"),
  read:    id  => api.patch(`/api/notifications/${id}/read`),
  readAll: ()  => api.patch("/api/notifications/read-all"),
};

export const messagesAPI = {
  conversations: ()    => api.get("/api/messages"),
  getMessages:   (id,p=1) => api.get(`/api/messages/${id}?page=${p}`),
  send:          (id,data) => api.post(`/api/messages/${id}`, data),
  delete:        id    => api.delete(`/api/messages/${id}`),
  unreadCount:   ()    => api.get("/api/messages/unread/count"),
};

export const searchAPI = {
  search:      (q,type) => api.get(`/api/search?q=${encodeURIComponent(q)}&type=${type||"all"}`),
  suggestions: q        => api.get(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
};

export const jobsAPI = {
  list:     p    => api.get("/api/jobs",           { params:p }),
  get:      id   => api.get(`/api/jobs/${id}`),
  create:   data => api.post("/api/jobs",           data),
  apply:    (id,data) => api.post(`/api/jobs/${id}/apply`, data),
  save:     id   => api.post(`/api/jobs/${id}/save`),
};

export const uploadAPI = {
  avatar:    file => { const f=new FormData(); f.append("avatar",file);     return api.post("/api/upload/avatar",    f, { headers:{"Content-Type":"multipart/form-data"} }); },
  postImage: file => { const f=new FormData(); f.append("image",file);      return api.post("/api/upload/post-image",f, { headers:{"Content-Type":"multipart/form-data"} }); },
  cv:        file => { const f=new FormData(); f.append("cv",file);         return api.post("/api/upload/cv",        f, { headers:{"Content-Type":"multipart/form-data"} }); },
  logo:      file => { const f=new FormData(); f.append("logo",file);       return api.post("/api/upload/logo",      f, { headers:{"Content-Type":"multipart/form-data"} }); },
};

export const challengesAPI = {
  list: p => api.get("/api/challenges", { params:p }),
  register: id => api.post(`/api/challenges/${id}/register`),
};

export const resourcesAPI = {
  list:     p    => api.get("/api/resources",       { params:p }),
  submit:   data => api.post("/api/resources/submit",data),
  download: id   => api.post(`/api/resources/${id}/download`),
};

export const adminAPI = {
  stats:              ()        => api.get("/api/admin/stats"),
  users:              p         => api.get("/api/admin/users",     { params:p }),
  banUser:            id        => api.patch(`/api/admin/users/${id}/ban`),
  verifyUser:         id        => api.patch(`/api/admin/users/${id}/verify`),
  getSettings:        ()        => api.get("/api/admin/settings"),
  saveSetting:        (k,v)     => api.patch(`/api/admin/settings/${k}`, { value:v }),
  runScraper:         ()        => api.post("/api/admin/apify/run"),
  announce:           data      => api.post("/api/admin/announcements", data),
  jobs:               s         => api.get("/api/admin/jobs",      { params:{ status:s } }),
  approveJob:         id        => api.patch(`/api/admin/jobs/${id}/approve`),
  featureJob:         id        => api.patch(`/api/admin/jobs/${id}/feature`),
  rejectJob:          id        => api.delete(`/api/admin/jobs/${id}`),
};

export default api;
