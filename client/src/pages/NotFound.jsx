import {
  ArrowLeft,
  Compass,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="not-found-page">
      <div className="not-found-content">
        <span className="not-found-icon">
          <MapPin size={30} />
        </span>

        <strong>404</strong>
        <h1>This path leads nowhere.</h1>

        <p>
          The page you are looking for does not
          exist or may have been moved.
        </p>

        <div className="not-found-actions">
          <Link
            to="/"
            className="button button-primary"
          >
            <ArrowLeft size={17} />
            Return home
          </Link>

          {isAuthenticated && (
            <Link
              to="/trips"
              className="button button-secondary"
            >
              <Compass size={17} />
              My Trips
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default NotFound;