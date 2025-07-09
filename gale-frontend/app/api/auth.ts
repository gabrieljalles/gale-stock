import { JwtPayload } from "jwt-decode";
import { api } from "./api";
import { requestWithAuth } from "./requestWithAuth";

interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

interface RegisterData {
  fullName: string;
  cellPhone: string;
  gender: "Masculine" | "Feminine" | "Other" | "DoNotInform";
  dateOfBirth: string;
  email: string;
  cpfCNPJ: string;
  password: string;
  confirmPassword: string;
}

interface UpdatePasswordData {
  token: string;
  newPassword: string;
}

export const resendEmail = async (email: string) => {
  const response = await api.post("/user/resend-verification", { email });
  return response.data;
};

export const sendPasswordResetEmail = async (email: string) => {
  const response = await api.post("/user/send-password-reset-email", { email });
  return response.data;
};

export const updatePassword = async (data: UpdatePasswordData) => {
  const response = await api.post("/auth/reset-password", data);
  return response.data;
};

export const login = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);
  const { access_token } = response.data;
  localStorage.setItem("token", access_token);
  return response.data;
};

export const register = async (data: RegisterData) => {
  const { confirmPassword, ...payload } = data;
  const response = await api.post("/user/register", payload);
  return response.data;
};

export const logout = async () => {
  await requestWithAuth(async () => {
    localStorage.removeItem("token");
    return Promise.resolve();
  });
};
