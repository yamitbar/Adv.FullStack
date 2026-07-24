import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(
    Boolean(localStorage.getItem("token"))
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken =
        localStorage.getItem("token");

      if (!storedToken) {
        setInitializing(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setToken(storedToken);
        setUser(data.user);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post(
        "/auth/login",
        credentials
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      return data;
    } catch (loginError) {
      const responseData =
        loginError?.response?.data;

      const message =
        typeof responseData === "string"
          ? responseData
          : responseData?.message ||
            loginError?.message ||
            "Login failed";

      setError(message);
      throw loginError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post(
        "/auth/register",
        userData
      );

      return data;
    } catch (registerError) {
      const message =
        registerError.response?.data?.message ||
        "Registration failed";

      setError(message);
      throw registerError;
    } finally {
      setLoading(false);
    }
  };

  // useCallback (rather than a plain function, unlike login/register/
  // clearAuthError above) because it closes over `navigate`, a hook
  // value - keeping it stable lets it be listed explicitly in the
  // `value` useMemo's dependency array below without defeating that
  // memoization on every render.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setError(null);

    // Navigate to /login in the same tick as the auth-state update
    // above (React batches both, so the router re-renders once with
    // the new location already in place). This matters: without an
    // explicit navigate here, logging out while on a protected route
    // (e.g. /trips/:id) left the URL unchanged, so ProtectedRoute
    // re-rendered with isAuthenticated=false at that same URL and
    // redirected to /login itself - stashing the just-abandoned route
    // as location.state.from, indistinguishable from a genuine
    // logged-out user trying to reach a protected page. The next
    // person to log in on that same /login screen then inherited the
    // previous user's route. Navigating here first means /login is
    // already the current location by the time anything re-renders,
    // so ProtectedRoute for the old route never gets a chance to run.
    // No `state` is passed, so this /login entry starts clean.
    navigate("/login", { replace: true });
  }, [navigate]);

  const clearAuthError = () => {
    setError(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      initializing,
      error,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      clearAuthError,
    }),
    [
      user,
      token,
      loading,
      initializing,
      error,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};
