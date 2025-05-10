import axios from "axios";

const isBrowser = typeof window !== "undefined";
const isProduction = process.env.NODE_ENV === "production";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isProduction ? "https://api.suaempresa.com" : "http://localhost:3000");

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
