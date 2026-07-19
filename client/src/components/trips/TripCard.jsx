import { memo } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../../services/api";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function TripCard({ trip }) {
  const imageUrl = resolveMediaUrl(trip.coverImage);

  return (
    <article className="trip-card">
      <div className="trip-card-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={trip.title}
            loading="lazy"
          />
        ) : (
          <div className="trip-card-image-placeholder">
            <MapPin size={32} />
            <span>{trip.destination}</span>
          </div>
        )}
      </div>

      <div className="trip-card-content">
        <div className="trip-card-heading">
          <div>
            <span className="trip-card-destination">
              {trip.destination}
            </span>

            <h2>{trip.title}</h2>
          </div>
        </div>

        {trip.description && (
          <p className="trip-card-description">
            {trip.description}
          </p>
        )}

        <div className="trip-card-meta">
          <span>
            <CalendarDays size={17} />
            {formatDate(trip.startDate)}
          </span>

          <span>
            <Users size={17} />
            {trip.participants?.length || 1}{" "}
            participant
            {trip.participants?.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        <Link
          to={`/trips/${trip._id}`}
          className="button button-secondary button-full"
        >
          Open trip
        </Link>
      </div>
    </article>
  );
}

export default memo(TripCard);
