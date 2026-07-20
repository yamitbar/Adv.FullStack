import { memo } from "react";

import {
  CalendarDays,
  MapPin,
} from "lucide-react";

import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../../services/api";

function formatDate(dateValue) {
  if (!dateValue) {
    return "Visit date not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function LocationCard({ location }) {
  const imageUrl = resolveMediaUrl(
    location.coverImage
  );

  return (
    <article className="location-card">
      <div className="location-card-image">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={
              location.title ||
              location.address
            }
            loading="lazy"
          />
        ) : (
          <div className="location-image-placeholder">
            <MapPin size={28} />
          </div>
        )}
      </div>

      <div className="location-card-content">
        <h3>
          {location.title ||
            location.address}
        </h3>

        <p className="location-address">
          <MapPin size={16} />
          {location.address}
        </p>

        <p className="location-date">
          <CalendarDays size={16} />
          {formatDate(location.visitedAt)}
        </p>

        <Link
          to={`/locations/${location._id}`}
          className="location-card-link"
        >
          View memories
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default memo(LocationCard);
