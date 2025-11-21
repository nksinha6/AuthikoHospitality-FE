import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div style={{ marginBottom: "32px", padding: "0 8px" }}>
          <h1 className="h-page-title" style={{ fontSize: "20px", margin: 0 }}>
            OnePass
          </h1>
        </div>

        <div className="nav-section-label">Main</div>
        {/* <NavLink
          to="/"
          className={`nav-item ${location.pathname === "/" ? "nav-item--active" : ""}`}
        >
          <span>Dashboard</span>
        </NavLink> */}

        <NavLink
          to="/check-ins"
          className={`nav-item ${location.pathname === "/check-ins" ? "nav-item--active" : ""}`}
        >
          <span>Check-ins</span>
        </NavLink>
      </nav>

      <div className="app-main">
        <div className="app-topbar">
          <div style={{ flex: 1 }}></div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="button button-secondary"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
