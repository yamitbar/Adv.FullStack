import { useEffect } from "react";
import {
  ArrowRight,
  Camera,
  Compass,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useAuth } from "../context/AuthContext";
import { resolveMediaUrl } from "../services/api";
import { fetchTrips } from "../store/slices/tripsSlice";
import {
  formatTravelerCount,
  getTravelerCount,
} from "../utils/normalizeId";

function formatTripDateRange(startDate, endDate) {
  if (!startDate) {
    return "Dates not set yet";
  }

  const formatter = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!endDate) {
    return formatter.format(new Date(startDate));
  }

  return `${formatter.format(
    new Date(startDate)
  )} – ${formatter.format(new Date(endDate))}`;
}

// Returns the number of whole days between now and a future date, or
// null if the date is missing or already in the past.
function getDaysUntil(dateValue) {
  if (!dateValue) {
    return null;
  }

  const diffMs =
    new Date(dateValue).setHours(0, 0, 0, 0) -
    new Date().setHours(0, 0, 0, 0);

  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return days > 0 ? days : null;
}

const features = [
  {
    icon: Compass,
    title: "Build your travel story",
    description:
      "Organize every trip, destination and memory in one beautiful journal.",
  },
  {
    icon: Users,
    title: "Create it together",
    description:
      "Invite friends and family so everyone can contribute to the same journey.",
  },
  {
    icon: Camera,
    title: "Keep every memory",
    description:
      "Connect photos and stories to the exact places where they happened.",
  },
];

function Home() {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  const { items: trips } = useSelector(
    (state) => state.trips
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrips());
    }
  }, [isAuthenticated, dispatch]);

  // Trips are sorted newest-first by the API, so the first entry
  // doubles as the "recent / upcoming" trip shown in the hero card.
  const featuredTrip =
    isAuthenticated && trips.length > 0
      ? trips[0]
      : null;

  const daysUntilFeaturedTrip = featuredTrip
    ? getDaysUntil(featuredTrip.startDate)
    : null;

  const recentTrips = isAuthenticated
    ? trips.slice(0, 3)
    : [];

  return (
    <>
      <section className="hero-section">
        <div className="hero-image" />

        <div className="hero-overlay" />

        <div className="shell hero-content">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={16} />
              Your journeys, beautifully remembered
            </div>

            <h1>
              Every journey
              <span> deserves a story.</span>
            </h1>

            <p>
              Create collaborative travel journals
              with shared locations, memories and
              the people who made each adventure
              unforgettable.
            </p>

            <div className="hero-actions">
              <Link
                to={
                  isAuthenticated
                    ? "/trips/new"
                    : "/register"
                }
                className="button button-primary button-large"
              >
                <Plus size={19} />
                Start a journey
              </Link>
            </div>
          </div>

          {featuredTrip && (
            <Link
              to={`/trips/${featuredTrip._id}`}
              className="hero-floating-card"
            >
              <span className="floating-card-label">
                {daysUntilFeaturedTrip
                  ? "Upcoming journey"
                  : "Recent journey"}
              </span>

              <strong>{featuredTrip.title}</strong>

              <p>
                {daysUntilFeaturedTrip
                  ? `${daysUntilFeaturedTrip} day${
                      daysUntilFeaturedTrip === 1
                        ? ""
                        : "s"
                    } until your next adventure`
                  : "Continue documenting this journey"}
              </p>

              <div className="floating-card-progress">
                <span />
              </div>

              <div className="floating-card-footer">
                <span>
                  {formatTripDateRange(
                    featuredTrip.startDate,
                    featuredTrip.endDate
                  )}
                </span>

                <span>
                  {formatTravelerCount(
                    getTravelerCount(featuredTrip)
                  )}
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="section section-intro">
        <div className="shell">
          <div className="section-heading section-heading-centered">
            <span className="section-kicker">
              Travel together
            </span>

            <h2>
              A living travel journal for the
              whole group.
            </h2>

            <p>
              Pathly brings locations, stories and
              shared moments together so your trip
              remains meaningful long after you
              return home.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="feature-card"
                >
                  <div className="feature-icon">
                    <Icon size={23} />
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {recentTrips.length > 0 && (
        <section className="section trips-preview-section">
          <div className="shell">
            <div className="section-heading-row">
              <div className="section-heading">
                <span className="section-kicker">
                  Your recent journeys
                </span>
                <h2>Continue where you left off</h2>
              </div>

              <Link
                to="/trips"
                className="text-link"
              >
                View all trips
                <ArrowRight size={17} />
              </Link>
            </div>

            <div className="trip-preview-grid">
              {recentTrips.map((trip) => {
                const previewImage = resolveMediaUrl(
                  trip.coverImage
                );

                return (
                  <Link
                    to={`/trips/${trip._id}`}
                    key={trip._id}
                    className="trip-preview-card"
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={trip.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="trip-preview-card-placeholder" />
                    )}

                    <div className="trip-preview-overlay" />

                    <div className="trip-preview-content">
                      <span>
                        <MapPin size={14} />
                        {trip.destination}
                      </span>

                      <h3>{trip.title}</h3>
                      <p>
                        {formatTripDateRange(
                          trip.startDate,
                          trip.endDate
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="section cta-section">
        <div className="shell cta-card">
          <div>
            <span className="section-kicker">
              Your next story starts here
            </span>

            <h2>
              Turn your next trip into something
              you will keep forever.
            </h2>
          </div>

          <Link
            to={
              isAuthenticated
                ? "/trips/new"
                : "/register"
            }
            className="button button-light button-large"
          >
            Create your first trip
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>
    </>
  );
}

export default Home;