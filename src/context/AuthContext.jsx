import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { STORAGE_KEYS } from "../constants/config.js";

// Utility function to decode JWT token
const decodeJWT = (token) => {
  try {
    if (!token) return null;
    
    // JWT format: header.payload.signature
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

// Utility function to extract tenantId and propertyIds from token
const extractIdsFromToken = (decodedToken) => {
  if (!decodedToken) return { tenantId: null, propertyIds: [] };
  
  // Extract tenantId (it might be string or number)
  const tenantId = decodedToken.tenantId ? 
    String(decodedToken.tenantId) : 
    decodedToken["tenantId"] || null;
  
  // Extract propertyIds (can be string or array)
  let propertyIds = [];
  const propertyIdsValue = decodedToken.propertyIds || decodedToken["propertyIds"];
  
  if (propertyIdsValue) {
    if (Array.isArray(propertyIdsValue)) {
      propertyIds = propertyIdsValue.map(id => String(id));
    } else if (typeof propertyIdsValue === 'string') {
      // Handle comma-separated string or single value
      propertyIds = propertyIdsValue.split(',').map(id => id.trim()).filter(id => id);
    } else {
      propertyIds = [String(propertyIdsValue)];
    }
  }
  
  // Extract user role
  const role = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 
               decodedToken.role || 
               "Receptionist";
  
  // Extract user email
  const userEmail = decodedToken.sub || decodedToken.email || "";
  
  return {
    tenantId,
    propertyIds,
    role,
    userEmail,
    fullTokenData: decodedToken
  };
};

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    tenantId: null,
    propertyIds: [],
    role: "",
    userEmail: ""
  });

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

      // Check if access token exists and is not expired
      const accessToken = getItemFromStorages(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = getItemFromStorages(STORAGE_KEYS.TOKEN_EXPIRES_AT);

      if (accessToken && expiresAt) {
        const expirationTime = new Date(expiresAt).getTime();
        const currentTime = Date.now();

        // Check if token is expired (with 5 minute buffer)
        if (expirationTime > currentTime + 5 * 60 * 1000) {
          // Decode token and extract IDs
          const decodedToken = decodeJWT(accessToken);
          if (decodedToken) {
            const ids = extractIdsFromToken(decodedToken);
            setUserData(ids);
            
            // Also store in storage for quick access
            const storage = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ? 
                          sessionStorage : localStorage;
            storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(ids));
          }
          
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          clearAuthData();
          setIsAuthenticated(false);
          setUserData({ tenantId: null, propertyIds: [], role: "", userEmail: "" });
        }
      } else {
        setIsAuthenticated(false);
        setUserData({ tenantId: null, propertyIds: [], role: "", userEmail: "" });
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const clearAuthData = () => {
    setIsAuthenticated(false);
    setUserData({ tenantId: null, propertyIds: [], role: "", userEmail: "" });
    
    if (typeof window !== "undefined") {
      // Remove auth data from both storages to be safe
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  };

  // tokens: { accessToken, refreshToken, expiresAt }
  // remember: boolean -> when true persist to localStorage, otherwise sessionStorage
  const login = (tokens, remember = true) => {
    setIsAuthenticated(true);
    
    // Decode token and extract IDs
    const decodedToken = decodeJWT(tokens.accessToken);
    const ids = extractIdsFromToken(decodedToken);
    setUserData(ids);
    
    if (typeof window !== "undefined") {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.AUTH, "true");
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      storage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, tokens.expiresAt);
      storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(ids));
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const value = useMemo(
    () => ({ 
      isAuthenticated, 
      loading, 
      login, 
      logout,
      userData 
    }),
    [isAuthenticated, loading, userData]
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