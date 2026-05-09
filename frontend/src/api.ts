import axios from "axios";

const API = axios.create({
  baseURL: "https://crm-backend-519590348715.asia-south1.run.app"
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;