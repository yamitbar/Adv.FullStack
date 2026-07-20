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
  Pencil,
  RefreshCw,
  SearchX,
  Trash2,
  User,
  X,
} from "lucide-react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api, { resolveMediaUrl } from "../services/api";
import MemoriesSection from "../components/memories/MemoriesSection";
import { useAuth } from "../context/AuthContext";
import { isSameEntity } from "../utils/normalizeId";

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

const emptyEditForm = {
  title: "",
  address: "",
  visitedAt: "",
  coverImage: "",
};

function toDateInputValue(dateValue) {
  if (!dateValue) {
    return "";
  }

  return new Date(dateValue).toISOString().slice(0, 10);
}

function LocationDetails() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(
    emptyEditForm
  );
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const isCreator = isSameEntity(
    location?.createdBy,
    user?._id
  );

  const handleStartEdit = () => {
    setEditForm({
      title: location.title || "",
      address: location.address || "",
      visitedAt: toDateInputValue(
        location.visitedAt
      ),
      coverImage: location.coverImage || "",
    });

    setEditError("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleEditChange = (event) => {
    setEditError("");

    setEditForm((currentData) => ({
      ...currentData,
      [event.target.name]: event.target.value,
    }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editForm.address.trim()) {
      setEditError("Address is required.");
      return;
    }

    // Joi rejects an empty-string date, so an optional blank date is
    // simply left out of the request rather than sent as "".
    const locationData = {
      title: editForm.title.trim(),
      address: editForm.address.trim(),
      coverImage: editForm.coverImage.trim(),
    };

    if (editForm.visitedAt) {
      locationData.visitedAt = editForm.visitedAt;
    }

    setSaving(true);
    setEditError("");

    try {
      const { data } = await api.put(
        `/locations/${locationId}`,
        locationData
      );

      setLocation(data.location);
      setIsEditing(false);
    } catch (submitError) {
      setEditError(
        submitError?.response?.data?.message ||
          "Failed to update this location."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete "${
        location.title || location.address
      }"? Its memories and uploaded photos will be removed too. This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await api.delete(`/locations/${locationId}`);

      navigate(backToTripHref, {
        state: {
          message: "Location deleted successfully.",
        },
      });
    } catch (deleteFailure) {
      setIsDeleting(false);
      setDeleteError(
        deleteFailure?.response?.data?.message ||
          "Failed to delete this location."
      );
    }
  };

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
                location.title || location.address
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
          <h1>
            {location.title || location.address}
          </h1>

          {location.address && (
            <p className="location-address-line">
              {location.address}
            </p>
          )}

          {isCreator && (
            <div className="location-hero-actions">
              <button
                type="button"
                className="button location-hero-action-button"
                onClick={handleStartEdit}
              >
                <Pencil size={16} />
                Edit
              </button>

              <button
                type="button"
                className="button location-hero-action-button location-delete-button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={16} />
                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          )}
        </div>
      </section>

      {deleteError && (
        <div className="form-error location-details-inline-error">
          {deleteError}
        </div>
      )}

      {isEditing && (
        <section className="location-edit-card">
          <div className="location-edit-heading">
            <h2>Edit location</h2>

            <button
              type="button"
              className="location-edit-close"
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
            >
              <X size={20} />
            </button>
          </div>

          {editError && (
            <div className="form-error">
              {editError}
            </div>
          )}

          <form
            className="location-edit-form"
            onSubmit={handleEditSubmit}
          >
            <label>
              Custom title
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                maxLength={100}
              />
            </label>

            <label className="location-edit-full">
              Full address
              <input
                type="text"
                name="address"
                value={editForm.address}
                onChange={handleEditChange}
                required
              />
            </label>

            <label>
              Date visited
              <input
                type="date"
                name="visitedAt"
                value={editForm.visitedAt}
                onChange={handleEditChange}
              />
            </label>

            <label>
              Cover image URL
              <input
                type="url"
                name="coverImage"
                value={editForm.coverImage}
                onChange={handleEditChange}
                placeholder="https://example.com/location.jpg"
              />
            </label>

            <div className="location-edit-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button button-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      )}

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
