import {
  Navigate,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
  const {
    isAuthenticated,
    initializing,
  } = useAuth();

  const location = useLocation();

  if (initializing) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        <span>Restoring your journey...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;