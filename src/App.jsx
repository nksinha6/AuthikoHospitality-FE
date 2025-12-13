import { useCallback, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { useAuth } from "./context/AuthContext.jsx";
import { UI_TEXT, ROUTES } from "./constants/ui.js";

export default function App() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

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

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Main navigation">
        <div className="nav-brand">
          <div>
            <h1 className="h-page-title nav-brand-title">{UI_TEXT.APP_NAME}</h1>
          </div>
        </div>

        <div className="nav-links">
          <NavLink
            to={ROUTES.TODAYS_BOOKINGS}
            className={`nav-item ${
              isActiveRoute(ROUTES.TODAYS_BOOKINGS) ? "nav-item--active" : ""
            }`}
            aria-current={
              isActiveRoute(ROUTES.TODAYS_BOOKINGS) ? "page" : undefined
            }
          >
            <span>{UI_TEXT.NAV_TODAYS_BOOKINGS}</span>
          </NavLink>

          <NavLink
            to={ROUTES.ALL_BOOKINGS}
            className={`nav-item ${
              isActiveRoute(ROUTES.ALL_BOOKINGS) ? "nav-item--active" : ""
            }`}
            aria-current={
              isActiveRoute(ROUTES.ALL_BOOKINGS) ? "page" : undefined
            }
          >
            <span>{UI_TEXT.NAV_ALL_BOOKINGS}</span>
          </NavLink>

          <NavLink
            to={ROUTES.CHECK_INS}
            className={`nav-item ${
              isActiveRoute(ROUTES.CHECK_INS) ? "nav-item--active" : ""
            }`}
            aria-current={isActiveRoute(ROUTES.CHECK_INS) ? "page" : undefined}
          >
            <span>{UI_TEXT.NAV_CHECK_INS}</span>
          </NavLink>
        </div>
      </nav>

      <div className="app-main">
        <header className="app-topbar">
          {/* LEFT: Search */}
          <div className="header-search">
            <i className="ri-search-line"></i>
            <input type="text" placeholder="Search" />
          </div>

          {/* RIGHT: Icons */}
          <div className="header-icons">
            <button className="icon-btn">
              <i className="ri-question-line"></i>
            </button>
            <button className="icon-btn">
              <i className="ri-notification-3-line"></i>
            </button>
            <div className="profile-wrapper">
              <button
                className="icon-btn"
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <i className="ri-user-line"></i>
              </button>

              {showDropdown && (
                <div className="profile-dropdown">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item"
                    aria-label={UI_TEXT.BUTTON_LOGOUT}
                  >
                    {UI_TEXT.BUTTON_LOGOUT}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
