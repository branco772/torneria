import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // importante

  const refreshUser = async () => {
    const res = await api.get("/me");
    setUser(res.data);
    return res.data;
  };

  // 🔥 Verificar token al iniciar app
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // 👉 crea este endpoint en FastAPI: /me
        await refreshUser();
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (token) => {
    localStorage.setItem("token", token);

    try {
        await refreshUser(); // 🔥 obtiene usuario real
    } catch {
        localStorage.removeItem("token");
        setUser(null);
    }
    };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
