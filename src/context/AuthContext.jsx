import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { STORAGE_KEYS } from "../constants/config.js";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      // Helper: prefer sessionStorage only if token stored there, otherwise localStorage
      const getItemFromStorages = (key) => {
        const fromSession = sessionStorage.getItem(key);
        if (fromSession) return fromSession;
        return localStorage.getItem(key);
      };

      // Check if access token exists and is not expired (look in sessionStorage then localStorage)
      const accessToken = getItemFromStorages(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = getItemFromStorages(STORAGE_KEYS.TOKEN_EXPIRES_AT);

      if (accessToken && expiresAt) {
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();

        // Check if token is expired (with 5 minute buffer)
        if (expirationTime > currentTime + 5 * 60 * 1000) {
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          clearAuthData();
        }
      } else {
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const clearAuthData = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      // Remove auth data from both storages to be safe
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
    }
  };

  // tokens: { accessToken, refreshToken, expiresAt }
  // remember: boolean -> when true persist to localStorage, otherwise sessionStorage
  const login = (tokens, remember = true) => {
    setIsAuthenticated(true);
    if (typeof window !== "undefined") {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.AUTH, "true");
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expiresAt);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    clearAuthData();
  };

  const value = useMemo(
    () => ({ isAuthenticated, loading, login, logout }),
    [isAuthenticated, loading]
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
