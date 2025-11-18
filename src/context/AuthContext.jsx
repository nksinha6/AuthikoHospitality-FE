import { createContext, useContext, useMemo, useState, useEffect } from "react";

const AuthContext = createContext(undefined);
const STORAGE_KEY = "onepass_auth";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const authStatus = window.localStorage.getItem(STORAGE_KEY) === "true";
      
      // If you need to verify token with API, do it here
      // const token = localStorage.getItem("onepass_token");
      // if (token) {
      //   try {
      //     const response = await apiClient.get("/auth/verify");
      //     setIsAuthenticated(true);
      //   } catch {
      //     setIsAuthenticated(false);
      //   }
      // }
      
      setIsAuthenticated(authStatus);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "true");
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem("onepass_token");
    }
  };

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout }),
    [isAuthenticated, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

