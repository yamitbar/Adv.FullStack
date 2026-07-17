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
import { useAuth } from "../context/AuthContext";

const previewTrips = [
  {
    id: "usa-road-trip",
    title: "USA Road Trip",
    location: "United States",
    dates: "August 1–20, 2026",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "italy-summer",
    title: "Summer in Italy",
    location: "Italy",
    dates: "September 2025",
    image:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "alpine-weekend",
    title: "Alpine Weekend",
    location: "Switzerland",
    dates: "June 2025",
    image:
      "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=85",
  },
];

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
      "Connect photos, videos and stories to the exact places where they happened.",
  },
];

function Home() {
  const { isAuthenticated } = useAuth();

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
              with interactive maps, shared
              memories and the people who made each
              adventure unforgettable.
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

              <Link
                to="/map"
                className="button button-glass button-large"
              >
                <MapPin size={19} />
                Explore the map
              </Link>
            </div>
          </div>

          <div className="hero-floating-card">
            <span className="floating-card-label">
              Upcoming journey
            </span>

            <strong>USA Family Trip</strong>

            <p>
              17 days until your next adventure
            </p>

            <div className="floating-card-progress">
              <span />
            </div>

            <div className="floating-card-footer">
              <span>August 1–20</span>
              <span>5 travelers</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-intro">
        <div className="shell">
          <div className="section-heading section-heading-centered">
            <span className="section-kicker">
              Travel together
            </span>

            <h2>
              More than a map. A living travel
              journal.
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
            {previewTrips.map((trip) => (
              <Link
                to="/trips"
                key={trip.id}
                className="trip-preview-card"
              >
                <img
                  src={trip.image}
                  alt={trip.title}
                />

                <div className="trip-preview-overlay" />

                <div className="trip-preview-content">
                  <span>
                    <MapPin size={14} />
                    {trip.location}
                  </span>

                  <h3>{trip.title}</h3>
                  <p>{trip.dates}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section map-showcase-section">
        <div className="shell map-showcase">
          <div className="map-showcase-copy">
            <span className="section-kicker">
              Map every memory
            </span>

            <h2>
              See your story unfold across the
              world.
            </h2>

            <p>
              Every location becomes part of a
              visual journey. Open a pin to revisit
              the photos, stories and people
              connected to that place.
            </p>

            <Link
              to="/map"
              className="button button-primary"
            >
              Open your map
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="map-preview-card">
            <div className="map-preview-background" />

            <span className="map-pin map-pin-one">
              <MapPin size={18} />
            </span>

            <span className="map-pin map-pin-two">
              <MapPin size={18} />
            </span>

            <span className="map-pin map-pin-three">
              <MapPin size={18} />
            </span>

            <div className="map-memory-preview">
              <img
                src="https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=300&q=80"
                alt="Travel memory"
              />

              <div>
                <strong>Yellowstone</strong>
                <span>12 memories</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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