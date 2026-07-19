import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  MapPin,
  RefreshCw,
  SearchX,
  User,
} from "lucide-react";

import {
  Link,
  useParams,
} from "react-router-dom";

import api, { resolveMediaUrl } from "../services/api";
import MemoriesSection from "../components/memories/MemoriesSection";

import "./LocationDetails.css";

function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function LocationDetails() {
  const { locationId } = useParams();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const loadLocation = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const { data } = await api.get(
        `/locations/${locationId}`
      );

      setLocation(data.location);
    } catch (fetchError) {
      if (fetchError?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          fetchError?.response?.data?.message ||
            "Failed to load this location."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  // The location document always carries its parent trip id, so the
  // "Back to trip" link works even after a direct browser refresh -
  // it never depends on router state.
  const tripId =
    typeof location?.trip === "string"
      ? location.trip
      : location?.trip?._id;

  const backToTripHref = tripId
    ? `/trips/${tripId}`
    : "/trips";

  if (loading) {
    return (
      <main className="location-details-page">
        <section className="location-details-state">
          <div className="loader-spinner" />
          <h1>Loading location...</h1>
          <p>
            We are gathering the details for this
            place.
          </p>
        </section>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="location-details-page">
        <section className="location-details-state">
          <span className="location-details-state-icon">
            <SearchX size={30} />
          </span>

          <h1>Location not found</h1>

          <p>
            This location may have been removed, or
            you may not have access to it.
          </p>

          <Link
            to="/trips"
            className="button button-primary"
          >
            <ArrowLeft size={18} />
            Back to my trips
          </Link>
        </section>
      </main>
    );
  }

  if (error || !location) {
    return (
      <main className="location-details-page">
        <section className="location-details-state">
          <span className="location-details-state-icon error">
            <CircleAlert size={30} />
          </span>

          <h1>We could not open this location</h1>

          <p>{error}</p>

          <div className="location-details-state-actions">
            <Link
              to={backToTripHref}
              className="button button-secondary"
            >
              <ArrowLeft size={18} />
              Back to trip
            </Link>

            <button
              type="button"
              className="button button-primary"
              onClick={loadLocation}
            >
              <RefreshCw size={18} />
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  const imageUrl = resolveMediaUrl(
    location.coverImage
  );

  const visitedDate = formatDate(location.visitedAt);
  const createdDate = formatDate(location.createdAt);
  const creatorName =
    typeof location.createdBy === "object"
      ? location.createdBy?.name
      : null;

  return (
    <main className="location-details-page">
      <Link
        to={backToTripHref}
        className="location-details-back"
      >
        <ArrowLeft size={18} />
        Back to trip
      </Link>

      <section className="location-hero">
        <div className="location-hero-media">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={
                location.title || location.placeName
              }
              loading="lazy"
            />
          ) : (
            <div className="location-hero-placeholder">
              <MapPin size={48} />
            </div>
          )}

          <div className="location-hero-overlay" />
        </div>

        <div className="location-hero-content">
          <span className="location-place-badge">
            <MapPin size={16} />
            {location.placeName}
          </span>

          <h1>
            {location.title || location.placeName}
          </h1>

          {location.address && (
            <p className="location-address-line">
              {location.address}
            </p>
          )}
        </div>
      </section>

      <section className="location-meta-grid">
        {visitedDate && (
          <article className="location-meta-card">
            <span className="location-meta-icon">
              <CalendarDays size={20} />
            </span>

            <div>
              <span>Visited</span>
              <strong>{visitedDate}</strong>
            </div>
          </article>
        )}

        {creatorName && (
          <article className="location-meta-card">
            <span className="location-meta-icon">
              <User size={20} />
            </span>

            <div>
              <span>Added by</span>
              <strong>{creatorName}</strong>
            </div>
          </article>
        )}

        {createdDate && (
          <article className="location-meta-card">
            <span className="location-meta-icon">
              <CalendarDays size={20} />
            </span>

            <div>
              <span>Added on</span>
              <strong>{createdDate}</strong>
            </div>
          </article>
        )}
      </section>

      <MemoriesSection locationId={locationId} />
    </main>
  );
}

export default LocationDetails;
