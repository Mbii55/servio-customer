// src/services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../constants/config";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // ✅ IMPORTANT: Render cold start can take 20–60s
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Optional: you can log useful info for debugging timeouts
    // console.log("API error:", error?.message, error?.response?.status);

    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      // If you want automatic UI logout, do it in AuthContext by detecting missing token/user.
    }

    return Promise.reject(error);
  }
);

export default api;
