"use client";

import React, { createContext, useState, useEffect, useCallback } from "react";
import { LoginResponse, login as apiLogin } from "@/api/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  signin: (email: string, password: string) => Promise<User>;
  signout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  signin: async () => ({}) as User,
  signout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const decodeToken = (t: string): User => {
    const [, payloadB64] = t.split(".");
    const payload = JSON.parse(atob(payloadB64));
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) {
      try {
        const u = decodeToken(t);
        setToken(t);
        setUser(u);
      } catch {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  // Devolve o usuário logado porque quem chamou precisa decidir pra onde
  // ir na hora — o estado `user` do contexto ainda não atualizou aqui.
  const signin = useCallback(async (email: string, password: string) => {
    const { access_token } = await apiLogin({ email, password });
    const u = decodeToken(access_token);
    setToken(access_token);
    setUser(u);
    localStorage.setItem("token", access_token);
    return u;
  }, []);

  const signout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, signin, isLoading, signout }}>
      {children}
    </AuthContext.Provider>
  );
};
