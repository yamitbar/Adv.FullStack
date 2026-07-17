import { useState } from "react";

import {
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const {
    login,
    loading,
    error,
    clearAuthError,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const destination =
    location.state?.from?.pathname || "/";

  const successMessage =
    location.state?.message || "";


  const handleChange = (event) => {
    clearAuthError();

    setFormData((currentData) => ({
      ...currentData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await login(formData);
      navigate(destination, { replace: true });
    } catch {
      // The authentication context handles the error message.
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-panel">
        <Link to="/" className="brand auth-brand">
          <span className="brand-mark">
            <Compass size={22} />
          </span>

          <span className="brand-name">
            Pathly
          </span>
        </Link>

        <div className="auth-form-wrapper">
          <span className="section-kicker">
            Welcome back
          </span>

          <h1>Continue your journey.</h1>

          <p className="auth-introduction">
            Log in to revisit your trips, places
            and shared memories.
          </p>

          {successMessage && (
            <div className="form-success">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Email
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <div className="password-field">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="button button-primary button-full button-large"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Log in"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <p className="auth-switch">
            New to Pathly?{" "}
            <Link to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </section>

      <aside className="auth-visual auth-login-visual">
        <div className="auth-visual-overlay" />

        <div className="auth-visual-copy">
          <span>Every place holds a memory.</span>

          <h2>
            Return to the stories that made your
            journey unforgettable.
          </h2>
        </div>
      </aside>
    </div>
  );
}

export default Login;