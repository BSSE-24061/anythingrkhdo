import axios from "axios";
import { getToken } from "./session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (error, fallback = "Something went wrong") => {
  return error?.response?.data?.error || fallback;
};

export const userApi = {
  login: (payload) => api.post("/users/login", payload),
  googleLogin: (payload) => api.post("/users/google-login", payload),
  googleOnboarding: (payload) => api.post("/users/google-onboarding", payload),
  signup: (payload) => api.post("/users/signup", payload),
  list: () => api.get("/users"),
  updateVerification: (id, is_verified) =>
    api.patch(`/users/${id}/verification`, { is_verified }),
  getDoctorsBySpecialization: (specialization) => api.get(`/users/doctors/specialization/${specialization}`),
  getAllSpecializations: () => api.get("/users/specializations"),
  getConsultant: () => api.get("/users/consultant"),
  getConsultants: () => api.get("/users/consultant"),
};

export const historyApi = {
  byPatient: (patientId) => api.get(`/history/patient/${patientId}`),
  getByPatient: (patientId) => api.get(`/history/patient/${patientId}`),
  create: (payload) => api.post("/history", payload),
  add: (payload) => api.post("/history", payload),
};

export const vitalApi = {
  create: (payload) => api.post("/vitals", payload),
  add: (payload) => api.post("/vitals", payload),
  byPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  getByPatient: (patientId) => api.get(`/vitals/patient/${patientId}`),
  alerts: (patientId) => api.get(`/vitals/alerts/${patientId}`),
  getAlerts: (patientId) => api.get(`/vitals/alerts/${patientId}`),
};

export const prescriptionApi = {
  createMaster: (payload) => api.post("/prescriptions", payload),
  addMedication: (payload) => api.post("/prescriptions/medications", payload),
  byPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  byPrescription: (prescriptionId) =>
    api.get(`/prescriptions/${prescriptionId}/medications`),
};

export const medicationApi = {
  list: () => api.get("/medications"),
  create: (payload) => api.post("/medications", payload),
  getById: (id) => api.get(`/medications/${id}`),
  update: (id, payload) => api.put(`/medications/${id}`, payload),
  delete: (id) => api.delete(`/medications/${id}`),
  createLog: (payload) => api.post("/medications/logs", payload),
  byPatientLogs: (patientId) => api.get(`/medications/logs/patient/${patientId}`),
  getLogsByPatient: (patientId) => api.get(`/medications/logs/patient/${patientId}`),
  updateLogStatus: (logId, statusOrPayload) =>
    api.patch(
      `/medications/logs/${logId}/status`,
      typeof statusOrPayload === "string"
        ? { status: statusOrPayload }
        : statusOrPayload
    ),
};

export const appointmentApi = {
  create: (payload) => api.post("/appointments", payload),
  byPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  byDoctor: (doctorId) => api.get(`/appointments/doctor/${doctorId}`),
  updateStatus: (id, status) =>
    api.patch(`/appointments/${id}/status`, {
      status: status === "rejected" ? "cancelled" : status,
    }),
};

export const availabilityApi = {
  getDoctor: (doctorId) => api.get(`/availability/${doctorId}`),
  set: (payload) => api.post("/availability", payload),
  addSlot: (payload) => api.post("/availability/slots", payload),
  removeSlot: (slotId) => api.delete(`/availability/slots/${slotId}`),
};

export const chatApi = {
  inbox: (userId) => api.get(`/chat/inbox/${userId}`),
  roomMessages: (roomId) => api.get(`/chat/room/${roomId}`),
  findOrCreateRoom: (payload) => api.post("/chat/room", payload),
  sendMessage: (payload) => api.post("/chat/message", payload),
  markRoomRead: (roomId, userId) =>
    api.patch(`/chat/room/${roomId}/read`, { userId }),
};

export const forumApi = {
  feed: () => api.get("/community/posts"),
  createPost: (payload) => api.post("/community/posts", payload),
  getPost: (postId) => api.get(`/community/posts/${postId}`),
  reply: (payload) => api.post("/community/replies", payload),
  report: (payload) => api.post("/community/reports", payload),
  reports: () => api.get("/community/reports"),
  updatePostStatus: (postId, status) =>
    api.patch(`/community/posts/${postId}/status`, { status }),
};

export const blogApi = {
  feed: () => api.get("/blogs"),
  getArticle: (articleId, userId) => api.get(`/blogs/${articleId}`, { params: { userId } }),
  pending: () => api.get("/blogs/pending"),
  create: (payload) => api.post("/blogs", payload),
  updateStatus: (articleId, status) =>
    api.patch(`/blogs/${articleId}/status`, { status }),
  like: (payload) => api.post("/blogs/likes", payload),
  comment: (payload) => api.post("/blogs/comments", payload),
  bookmark: (payload) => api.post("/blogs/bookmarks", payload),
  unbookmark: (article_id, user_id) => api.delete("/blogs/bookmarks", { params: { article_id, user_id } }),
  bookmarks: (userId) => api.get(`/blogs/bookmarks/${userId}`),
};

export const notificationApi = {
  create: (payload) => api.post("/notifications", payload),
  unreadCount: (userId) =>
    api.get(`/notifications/user/${userId}/unread-count`),
  list: (userId) => api.get(`/notifications/user/${userId}`),
  markAllRead: (userId) => api.patch(`/notifications/user/${userId}/read-all`),
};

export default api;
