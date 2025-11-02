// src/api.js
import axios from "axios";

const root =
  (process.env.REACT_APP_API_URL?.replace(/\/+$/, "")) // strip trailing slash
  || "https://online-food-ordering-app-rdai.onrender.com";

const api = axios.create({
  baseURL: `${root}/api`,           // <<— include /api here
});

// attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// TEMP: log outgoing requests to verify URL
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

export default api;
