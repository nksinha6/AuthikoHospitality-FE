import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    navigate("/", { replace: true });
  };

  return (
    <section className="page login">
      <header>
        <p className="eyebrow">OnePass Console</p>
        <h1>Sign in to your account</h1>
        <p>Use any email/password to continue for now.</p>
      </header>
      <form className="login-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            value={formState.email}
            onChange={onChange}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            required
            placeholder="••••••••"
            value={formState.password}
            onChange={onChange}
          />
        </label>
        <button className="button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}

