import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./App.css";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">OnePass</p>
          <h1>Control Center</h1>
        </div>
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <button className="button button--ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
