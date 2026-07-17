import { useEffect } from "react";
import {
  CircleAlert,
  Map,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { Link } from "react-router-dom";

import TripCard from "../components/trips/TripCard";
import {
  clearTripsError,
  fetchTrips,
} from "../store/slices/tripsSlice";

import "./MyTrips.css";

function MyTrips() {
  const dispatch = useDispatch();

  const {
    items: trips,
    loading,
    error,
  } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(clearTripsError());
    dispatch(fetchTrips());
  };

  return (
    <main className="trips-page">
      <section className="trips-page-header">
        <div>
          <span className="section-kicker">
            Your journeys
          </span>

          <h1>My Trips</h1>

          <p>
            Revisit your adventures, continue
            documenting memories, or start
            planning somewhere new.
          </p>
        </div>

        <Link
          to="/trips/new"
          className="button button-primary"
        >
          <Plus size={18} />
          Create a trip
        </Link>
      </section>

      {loading && (
        <section className="trips-state">
          <div className="loader-spinner" />

          <h2>Loading your trips...</h2>

          <p>
            We are gathering your journeys and
            shared memories.
          </p>
        </section>
      )}

      {!loading && error && (
        <section className="trips-state trips-error-state">
          <span className="trips-state-icon">
            <CircleAlert size={30} />
          </span>

          <h2>We could not load your trips</h2>

          <p>{error}</p>

          <button
            type="button"
            className="button button-secondary"
            onClick={handleRetry}
          >
            <RefreshCw size={18} />
            Try again
          </button>
        </section>
      )}

      {!loading &&
        !error &&
        trips.length === 0 && (
          <section className="trips-state">
            <span className="trips-state-icon">
              <Map size={32} />
            </span>

            <h2>Your next journey starts here.</h2>

            <p>
              Create your first trip or join a
              shared journey using an invite code.
            </p>

            <div className="trips-empty-actions">
              <Link
                to="/trips/new"
                className="button button-primary"
              >
                <Plus size={18} />
                Create a trip
              </Link>

              <button
                type="button"
                className="button button-secondary"
              >
                Join with invite code
              </button>
            </div>
          </section>
        )}

      {!loading &&
        !error &&
        trips.length > 0 && (
          <section className="trips-grid">
            {trips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
              />
            ))}
          </section>
        )}
    </main>
  );
}

export default MyTrips;