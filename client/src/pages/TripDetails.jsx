import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  Copy,
  Image,
  Map,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import LocationCard from "../components/trips/LocationCard";
import ParticipantsModal from "../components/trips/ParticipantsModal";
import { resolveMediaUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  getTravelerCount,
  isSameEntity,
} from "../utils/normalizeId";

import {
  clearTripDetails,
  clearUpdateTripError,
  deleteTrip,
  fetchTripById,
  fetchTripLocations,
  updateTrip,
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

const emptyEditForm = {
  title: "",
  destination: "",
  description: "",
  startDate: "",
  endDate: "",
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Trims a stored date/time value down to the yyyy-mm-dd shape an
// <input type="date"> expects.
function toDateInputValue(dateValue) {
  if (!dateValue) {
    return "";
  }

  return new Date(dateValue)
    .toISOString()
    .slice(0, 10);
}

function TripDetails() {
  const { tripId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user } = useAuth();

  const [successMessage, setSuccessMessage] =
    useState(
      routerLocation.state?.message || ""
    );

  const [copied, setCopied] =
    useState(false);

  const [isParticipantsOpen, setIsParticipantsOpen] =
    useState(false);

  const [isEditing, setIsEditing] =
    useState(false);

  const [editForm, setEditForm] =
    useState(emptyEditForm);

  const [coverImageFile, setCoverImageFile] =
    useState(null);

  const [removeExistingImage, setRemoveExistingImage] =
    useState(false);

  const [editLocalError, setEditLocalError] =
    useState("");

  const [isDeleting, setIsDeleting] =
    useState(false);

  const fileInputRef = useRef(null);

  const {
    selectedTrip: trip,
    selectedTripLocations: locations,
    detailsLoading,
    locationsLoading,
    detailsError,
    locationsError,
    updatingTrip,
    updateTripError,
    deletingTrip,
    deleteTripError,
  } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(fetchTripById(tripId));
    dispatch(fetchTripLocations(tripId));

    return () => {
      dispatch(clearTripDetails());
    };
  }, [dispatch, tripId]);

  useEffect(() => {
    if (routerLocation.state?.message) {
      // Clear the router state so refreshing or navigating back does
      // not bring the banner back.
      navigate(routerLocation.pathname, {
        replace: true,
        state: {},
      });
    }
    // Only run once, when the page is entered with a message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const isCreator = isSameEntity(
    trip?.createdBy,
    user?._id
  );

  // Memoized so a blob URL is created exactly once per selected file,
  // and revoked on unmount/replacement instead of leaking.
  const newImagePreviewUrl = useMemo(
    () =>
      coverImageFile
        ? URL.createObjectURL(coverImageFile)
        : null,
    [coverImageFile]
  );

  useEffect(() => {
    return () => {
      if (newImagePreviewUrl) {
        URL.revokeObjectURL(newImagePreviewUrl);
      }
    };
  }, [newImagePreviewUrl]);

  const handleStartEdit = () => {
    setEditForm({
      title: trip.title || "",
      destination: trip.destination || "",
      description: trip.description || "",
      startDate: toDateInputValue(
        trip.startDate
      ),
      endDate: toDateInputValue(trip.endDate),
    });

    setCoverImageFile(null);
    setRemoveExistingImage(false);
    setEditLocalError("");
    dispatch(clearUpdateTripError());
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCoverImageFile(null);
    setRemoveExistingImage(false);
    setEditLocalError("");
    dispatch(clearUpdateTripError());
  };

  const handleEditChange = (event) => {
    setEditLocalError("");
    dispatch(clearUpdateTripError());

    setEditForm((currentData) => ({
      ...currentData,
      [event.target.name]:
        event.target.value,
    }));
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setEditLocalError("");
    dispatch(clearUpdateTripError());

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setEditLocalError(
        "Please choose a JPEG, PNG or WebP image."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setEditLocalError(
        "Image is too large. Please choose a file under 5MB."
      );
      return;
    }

    setCoverImageFile(file);
    setRemoveExistingImage(false);
  };

  // Clears a just-selected new file, reverting the preview back to the
  // trip's existing cover image (if it still has one).
  const handleRemoveSelectedFile = () => {
    setCoverImageFile(null);
  };

  // Explicitly clears the trip's existing cover image. Only relevant
  // when no new file is staged - the removeExistingImage flag is sent
  // to the backend as removeCoverImage so it can delete the old file.
  const handleClearExistingImage = () => {
    setRemoveExistingImage(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (
      !editForm.title.trim() ||
      !editForm.destination.trim()
    ) {
      setEditLocalError(
        "Title and destination are required."
      );
      return;
    }

    if (
      editForm.startDate &&
      editForm.endDate &&
      new Date(editForm.endDate) <
        new Date(editForm.startDate)
    ) {
      setEditLocalError(
        "End date cannot be earlier than start date."
      );
      return;
    }

    // Joi.date() rejects an empty string, so blank optional date fields
    // must be left out of the request entirely rather than sent as "".
    // This means clearing a previously-set date isn't supported yet -
    // only setting/changing it while non-empty.
    const tripFormData = new FormData();

    tripFormData.append("title", editForm.title.trim());
    tripFormData.append(
      "destination",
      editForm.destination.trim()
    );
    tripFormData.append(
      "description",
      editForm.description.trim()
    );

    if (editForm.startDate) {
      tripFormData.append("startDate", editForm.startDate);
    }

    if (editForm.endDate) {
      tripFormData.append("endDate", editForm.endDate);
    }

    if (coverImageFile) {
      tripFormData.append("coverImage", coverImageFile);
    } else if (removeExistingImage) {
      tripFormData.append("removeCoverImage", "true");
    }

    try {
      // Do NOT set a Content-Type header - Axios computes the
      // multipart boundary itself when the body is a FormData instance.
      await dispatch(
        updateTrip({ tripId, tripData: tripFormData })
      ).unwrap();

      setIsEditing(false);
    } catch {
      // Redux stores and displays the error message.
    }
  };

  const handleDeleteTrip = async () => {
    const confirmed = window.confirm(
      `Delete "${trip.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      await dispatch(
        deleteTrip(tripId)
      ).unwrap();

      navigate("/trips", {
        replace: true,
        state: {
          message: "Trip deleted successfully.",
        },
      });
    } catch {
      setIsDeleting(false);
      // Redux stores and displays the error message.
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

  const imageUrl = resolveMediaUrl(
    trip.coverImage
  );

  const participantsCount = getTravelerCount(trip);

  return (
    <main className="trip-details-page">
      <Link
        to="/trips"
        className="trip-details-back"
      >
        <ArrowLeft size={18} />
        Back to my trips
      </Link>

      {successMessage && (
        <div
          className="trips-success-banner"
          role="status"
        >
          <Check size={18} />
          <span>{successMessage}</span>

          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() =>
              setSuccessMessage("")
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

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
              onClick={handleCopyInviteCode}
            >
              {copied ? (
                <Check size={18} />
              ) : (
                <Share2 size={18} />
              )}
              {copied
                ? "Invite code copied"
                : "Share trip"}
            </button>

            <Link
              to={`/map?trip=${tripId}`}
              className="button trip-share-button"
            >
              <Map size={18} />
              View on map
            </Link>

            {isCreator && (
              <>
                <button
                  type="button"
                  className="button trip-share-button"
                  onClick={handleStartEdit}
                >
                  <Pencil size={18} />
                  Edit trip
                </button>

                <button
                  type="button"
                  className="button trip-share-button trip-delete-button"
                  onClick={handleDeleteTrip}
                  disabled={
                    isDeleting || deletingTrip
                  }
                >
                  <Trash2 size={18} />
                  {isDeleting || deletingTrip
                    ? "Deleting..."
                    : "Delete trip"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {deleteTripError && (
        <div className="form-error trip-details-inline-error">
          {deleteTripError}
        </div>
      )}

      {isEditing && (
        <section className="trip-edit-card">
          <div className="trip-edit-heading">
            <h2>Edit trip</h2>

            <button
              type="button"
              className="trip-edit-close"
              onClick={handleCancelEdit}
              aria-label="Cancel editing"
            >
              <X size={20} />
            </button>
          </div>

          {(editLocalError ||
            updateTripError) && (
            <div className="form-error">
              {editLocalError ||
                updateTripError}
            </div>
          )}

          <form
            className="trip-edit-form"
            onSubmit={handleEditSubmit}
          >
            <label>
              Trip title
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                maxLength={100}
                required
              />
            </label>

            <label>
              Destination
              <input
                type="text"
                name="destination"
                value={editForm.destination}
                onChange={handleEditChange}
                maxLength={100}
                required
              />
            </label>

            <label className="trip-edit-full">
              Description
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                rows={4}
                maxLength={500}
              />
            </label>

            <label>
              Start date
              <input
                type="date"
                name="startDate"
                value={editForm.startDate}
                onChange={handleEditChange}
              />
            </label>

            <label>
              End date
              <input
                type="date"
                name="endDate"
                value={editForm.endDate}
                onChange={handleEditChange}
                min={
                  editForm.startDate || undefined
                }
              />
            </label>

            <div className="trip-edit-full trip-edit-cover-field">
              <span className="trip-edit-cover-label">
                Cover image
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleImageSelected}
              />

              <button
                type="button"
                className="button button-secondary trip-edit-upload-button"
                onClick={handlePickImage}
              >
                <Image size={17} />
                {coverImageFile ? "Change image" : "Choose image"}
              </button>
            </div>

            {(newImagePreviewUrl ||
              (!removeExistingImage && imageUrl)) && (
              <div className="trip-edit-full trip-edit-preview">
                <img
                  src={newImagePreviewUrl || imageUrl}
                  alt="Trip cover preview"
                />

                <button
                  type="button"
                  className="trip-edit-preview-remove"
                  aria-label="Remove image"
                  onClick={
                    newImagePreviewUrl
                      ? handleRemoveSelectedFile
                      : handleClearExistingImage
                  }
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="trip-edit-actions">
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
                disabled={updatingTrip}
              >
                {updatingTrip
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      )}

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

        <button
          type="button"
          className="trip-summary-card trip-summary-card-button"
          onClick={() => setIsParticipantsOpen(true)}
          aria-haspopup="dialog"
        >
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
              {" · view names"}
            </small>
          </div>
        </button>

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

      {isParticipantsOpen && (
        <ParticipantsModal
          trip={trip}
          onClose={() =>
            setIsParticipantsOpen(false)
          }
        />
      )}
    </main>
  );
}

export default TripDetails;
