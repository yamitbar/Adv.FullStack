import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  Copy,
  Map,
  MapPin,
  Plus,
  RefreshCw,
  Share2,
  Users,
} from "lucide-react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Link,
  useParams,
} from "react-router-dom";

import LocationCard from "../components/trips/LocationCard";

import {
  clearTripDetails,
  fetchTripById,
  fetchTripLocations,
} from "../store/slices/tripsSlice";

import "./TripDetails.css";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getCoverImage(coverImage) {
  if (!coverImage) {
    return null;
  }

  if (coverImage.startsWith("http")) {
    return coverImage;
  }

  return `http://localhost:3000${coverImage}`;
}

function TripDetails() {
  const { tripId } = useParams();

  const dispatch = useDispatch();

  const [copied, setCopied] =
    useState(false);

  const {
    selectedTrip: trip,
    selectedTripLocations: locations,
    detailsLoading,
    locationsLoading,
    detailsError,
    locationsError,
  } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(fetchTripById(tripId));
    dispatch(fetchTripLocations(tripId));

    return () => {
      dispatch(clearTripDetails());
    };
  }, [dispatch, tripId]);

  const handleRetry = () => {
    dispatch(fetchTripById(tripId));
    dispatch(fetchTripLocations(tripId));
  };

  const handleCopyInviteCode = async () => {
    if (!trip?.inviteCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        trip.inviteCode
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  if (detailsLoading) {
    return (
      <main className="trip-details-page">
        <section className="trip-details-state">
          <div className="loader-spinner" />
          <h1>Loading your trip...</h1>
          <p>
            We are gathering the journey details.
          </p>
        </section>
      </main>
    );
  }

  if (detailsError || !trip) {
    return (
      <main className="trip-details-page">
        <section className="trip-details-state">
          <span className="trip-details-state-icon error">
            <CircleAlert size={30} />
          </span>

          <h1>We could not open this trip</h1>

          <p>
            {detailsError ||
              "The trip could not be found."}
          </p>

          <div className="trip-details-state-actions">
            <Link
              to="/trips"
              className="button button-secondary"
            >
              <ArrowLeft size={18} />
              Back to trips
            </Link>

            <button
              type="button"
              className="button button-primary"
              onClick={handleRetry}
            >
              <RefreshCw size={18} />
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  const imageUrl = getCoverImage(
    trip.coverImage
  );

  const participantsCount =
    trip.participants?.length || 1;

  return (
    <main className="trip-details-page">
      <Link
        to="/trips"
        className="trip-details-back"
      >
        <ArrowLeft size={18} />
        Back to my trips
      </Link>

      <section className="trip-hero">
        <div className="trip-hero-media">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={trip.title}
            />
          ) : (
            <div className="trip-hero-placeholder">
              <Map size={54} />

              <span>
                Your journey begins here
              </span>
            </div>
          )}

          <div className="trip-hero-overlay" />
        </div>

        <div className="trip-hero-content">
          <span className="trip-destination">
            <MapPin size={17} />
            {trip.destination}
          </span>

          <h1>{trip.title}</h1>

          {trip.description && (
            <p>{trip.description}</p>
          )}

          <div className="trip-hero-actions">
            <Link
              to={`/trips/${tripId}/locations/new`}
              className="button button-primary"
            >
              <Plus size={18} />
              Add location
            </Link>

            <button
              type="button"
              className="button trip-share-button"
            >
              <Share2 size={18} />
              Share trip
            </button>
          </div>
        </div>
      </section>

      <section className="trip-summary-grid">
        <article className="trip-summary-card">
          <span className="trip-summary-icon">
            <CalendarDays size={22} />
          </span>

          <div>
            <span>Travel dates</span>

            <strong>
              {formatDate(trip.startDate)}
            </strong>

            <small>
              Until {formatDate(trip.endDate)}
            </small>
          </div>
        </article>

        <article className="trip-summary-card">
          <span className="trip-summary-icon">
            <Users size={22} />
          </span>

          <div>
            <span>Participants</span>

            <strong>
              {participantsCount}
            </strong>

            <small>
              {participantsCount === 1
                ? "Traveler"
                : "Travelers"}
            </small>
          </div>
        </article>

        <article className="trip-summary-card invite-card">
          <span className="trip-summary-icon">
            <Share2 size={22} />
          </span>

          <div>
            <span>Invite code</span>

            <strong>
              {trip.inviteCode ||
                "Unavailable"}
            </strong>

            <small>
              Share it with your travel partners
            </small>
          </div>

          {trip.inviteCode && (
            <button
              type="button"
              className="copy-code-button"
              onClick={handleCopyInviteCode}
              aria-label="Copy invite code"
            >
              {copied ? (
                <Check size={19} />
              ) : (
                <Copy size={19} />
              )}
            </button>
          )}
        </article>
      </section>

      <section className="trip-locations-section">
        <div className="trip-section-heading">
          <div>
            <span className="section-kicker">
              Places along the way
            </span>

            <h2>Locations</h2>

            <p>
              Every stop becomes part of your
              shared travel story.
            </p>
          </div>

          <Link
            to={`/trips/${tripId}/locations/new`}
            className="button button-secondary"
          >
            <Plus size={18} />
            Add location
          </Link>
        </div>

        {locationsLoading && (
          <div className="locations-loading-state">
            <div className="loader-spinner" />
            <span>Loading locations...</span>
          </div>
        )}

        {!locationsLoading &&
          locationsError && (
            <div className="locations-error-state">
              <CircleAlert size={24} />

              <div>
                <strong>
                  Locations could not be loaded
                </strong>

                <p>{locationsError}</p>
              </div>

              <button
                type="button"
                className="button button-secondary"
                onClick={() =>
                  dispatch(
                    fetchTripLocations(tripId)
                  )
                }
              >
                <RefreshCw size={17} />
                Retry
              </button>
            </div>
          )}

        {!locationsLoading &&
          !locationsError &&
          locations.length === 0 && (
            <div className="locations-empty-state">
              <span className="trip-details-state-icon">
                <MapPin size={31} />
              </span>

              <h3>
                No locations have been added yet.
              </h3>

              <p>
                Add the first place you visited and
                begin documenting the journey.
              </p>

              <Link
                to={`/trips/${tripId}/locations/new`}
                className="button button-primary"
              >
                <Plus size={18} />
                Add first location
              </Link>
            </div>
          )}

        {!locationsLoading &&
          !locationsError &&
          locations.length > 0 && (
            <div className="locations-grid">
              {locations.map((location) => (
                <LocationCard
                  key={location._id}
                  location={location}
                />
              ))}
            </div>
          )}
      </section>
    </main>
  );
}

export default TripDetails;