import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");

    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

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
      const message =
        loginError.response?.data?.message ||
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
      error,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      clearAuthError,
    }),
    [user, token, loading, error]
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