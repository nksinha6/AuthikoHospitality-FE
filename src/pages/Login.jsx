import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "../components/Loader.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, loading, login } = useAuth();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  if (loading) {
    return <Loader />;
  }

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true); 
    await new Promise((resolve) => setTimeout(resolve, 750));
    setIsSubmitting(false);
    login();
    navigate(from, { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 className="h-page-title">Sign in</h1>
          <p className="text-muted" style={{ marginTop: "8px" }}>
            Use any email/password to continue
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label htmlFor="email" className="text-meta" style={{ display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              className="input"
              required
              placeholder="you@example.com"
              value={formState.email}
              onChange={onChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="text-meta" style={{ display: "block", marginBottom: "6px" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              className="input"
              required
              placeholder="••••••••"
              value={formState.password}
              onChange={onChange}
            />
          </div>

          <div style={{ marginTop: "8px" }}>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

