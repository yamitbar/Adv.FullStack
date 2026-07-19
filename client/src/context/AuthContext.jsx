import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
    setError(null);
  };

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
