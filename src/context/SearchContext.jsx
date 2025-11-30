import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const location = useLocation();

  // Reset search term when route changes
  useEffect(() => {
    setSearchTerm("");
  }, [location.pathname]);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        isSearchEnabled,
        setIsSearchEnabled,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}

