import { useCallback } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import navStyles from "./styles/Nav.module.css";
import topbarStyles from "./styles/Topbar.module.css";
import { useAuth } from "./context/AuthContext.jsx";
import { UI_TEXT, ROUTES } from "./constants/ui.js";

export default function App() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      <nav className={navStyles.appNav} aria-label="Main navigation">
        <div className={navStyles.navBrand}>
          <h1 className={`h-page-title ${navStyles.navBrandTitle}`}>{UI_TEXT.APP_NAME}</h1>
        </div>

        <div className={navStyles.navSectionLabel}>{UI_TEXT.NAV_SECTION_MAIN}</div>

        <NavLink
          to={ROUTES.CHECK_INS}
          className={`${navStyles.navItem} ${isActiveRoute(ROUTES.CHECK_INS) ? navStyles.navItemActive : ""}`}
          aria-current={isActiveRoute(ROUTES.CHECK_INS) ? "page" : undefined}
        >
          <span>{UI_TEXT.NAV_CHECK_INS}</span>
        </NavLink>
      </nav>

      <div className="app-main">
        <header className={topbarStyles.appTopbar} role="banner">
          <div className={topbarStyles.topbarSpacer} aria-hidden="true"></div>
          <div className="flex-gap">
            <button
              className="button button-secondary"
              type="button"
              onClick={handleLogout}
              aria-label={UI_TEXT.BUTTON_LOGOUT}
            >
              {UI_TEXT.BUTTON_LOGOUT}
            </button>
          </div>
        </header>

        <main className="app-content" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
