// lib/auth.js — Auth context for JamiiAI
import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { authAPI } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const token = Cookies.get("jamii_token");
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => Cookies.remove("jamii_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    Cookies.set("jamii_token", res.data.token, { expires: 30 });
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    Cookies.set("jamii_token", res.data.token, { expires: 30 });
    setUser(res.data.user);
    return res.data;
  };

  const onboard = async (data) => {
    const res = await authAPI.onboard(data);
    setUser(u => ({ ...u, ...data, onboarded: true }));
    return res.data;
  };

  const logout = () => {
    Cookies.remove("jamii_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, onboard, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
