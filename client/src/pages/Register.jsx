import { useState } from "react";
import {
  ArrowRight,
  Compass,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [localError, setLocalError] =
    useState("");

  const {
    register,
    loading,
    error,
    clearAuthError,
  } = useAuth();

  const navigate = useNavigate();

  const handleChange = (event) => {
    setLocalError("");
    clearAuthError();

    setFormData((currentData) => ({
      ...currentData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setLocalError(
        "Passwords do not match."
      );
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. You can now log in.",
        },
      });
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
            Start exploring
          </span>

          <h1>Create your travel journal.</h1>

          <p className="auth-introduction">
            Bring your trips, memories and favorite
            people together in one place.
          </p>

          {(localError || error) && (
            <div className="form-error">
              {localError || error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Full name
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </label>

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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
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

            <label>
              Confirm password
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            <button
              type="submit"
              className="button button-primary button-full button-large"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </section>

      <aside className="auth-visual auth-register-visual">
        <div className="auth-visual-overlay" />

        <div className="auth-visual-copy">
          <span>Travel is better together.</span>

          <h2>
            Create a shared space for every place
            your journey takes you.
          </h2>
        </div>
      </aside>
    </div>
  );
}

export default Register;