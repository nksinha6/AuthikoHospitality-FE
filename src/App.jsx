import { useCallback, useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { useAuth } from "./context/AuthContext.jsx";
import { SearchProvider, useSearch } from "./context/SearchContext.jsx";
import { UI_TEXT, ROUTES } from "./constants/ui.js";

function AppContent() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { searchTerm, setSearchTerm, isSearchEnabled } = useSearch();
  const [inputValue, setInputValue] = useState("");

  // Reset input value when route changes
  useEffect(() => {
    setInputValue("");
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  const isActiveRoute = useCallback(
    (path) => {
      return location.pathname === path;
    },
    [location.pathname]
  );

  const handleSearchKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        // Update searchTerm in context when Enter is pressed
        setSearchTerm(inputValue);
      }
    },
    [inputValue, setSearchTerm]
  );

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Main navigation">
        <div className="nav-brand">
          <h1 className="h-page-title nav-brand-title">{UI_TEXT.APP_NAME}</h1>
        </div>

        <div className="nav-section-label">{UI_TEXT.NAV_SECTION_MAIN}</div>

        <NavLink
          to={ROUTES.CHECK_INS}
          className={`nav-item ${isActiveRoute(ROUTES.CHECK_INS) ? "nav-item--active" : ""}`}
          aria-current={isActiveRoute(ROUTES.CHECK_INS) ? "page" : undefined}
        >
          <span>{UI_TEXT.NAV_CHECK_INS}</span>
        </NavLink>
        <NavLink
          to={ROUTES.BOOKINGS}
          className={`nav-item ${isActiveRoute(ROUTES.BOOKINGS) ? "nav-item--active" : ""}`}
          aria-current={isActiveRoute(ROUTES.BOOKINGS) ? "page" : undefined}
        >
          <span>{UI_TEXT.NAV_BOOKINGS}</span>
        </NavLink>
      </nav>

      <div className="app-main">
        <header className="app-topbar" role="banner">
          <div className="search-bar-wrapper">
            <svg
              className="search-icon"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 19L14.65 14.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              className="input search-input"
              placeholder={UI_TEXT.SEARCH_PLACEHOLDER}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              disabled={!isSearchEnabled}
              aria-label="Search"
            />
          </div>
          <button
            className="button button-secondary"
            type="button"
            onClick={handleLogout}
            aria-label={UI_TEXT.BUTTON_LOGOUT}
          >
            {UI_TEXT.BUTTON_LOGOUT}
          </button>
        </header>

        <main className="app-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SearchProvider>
      <AppContent />
    </SearchProvider>
  );
}
