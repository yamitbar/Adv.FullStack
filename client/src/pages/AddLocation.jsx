import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Image,
  MapPin,
  Plus,
  X,
} from "lucide-react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  clearCreateLocationError,
  createLocation,
} from "../store/slices/tripsSlice";

import AddressAutocomplete from "../components/locations/AddressAutocomplete";

import "./AddLocation.css";

const initialFormData = {
  title: "",
  visitedAt: "",
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// Geoapify place metadata for the address field - see AddressAutocomplete.jsx.
const initialPlaceData = {
  address: "",
  placeName: "",
  lat: null,
  lng: null,
  placeId: "",
  isValid: true,
};

function AddLocation() {
  const { tripId } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState(initialFormData);

  const [placeData, setPlaceData] =
    useState(initialPlaceData);

  const [coverImageFile, setCoverImageFile] =
    useState(null);

  const [localError, setLocalError] =
    useState("");

  const fileInputRef = useRef(null);

  const {
    creatingLocation,
    createLocationError,
  } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(clearCreateLocationError());

    return () => {
      dispatch(clearCreateLocationError());
    };
  }, [dispatch]);

  // Memoized so a blob URL is created exactly once per selected file,
  // and revoked on unmount/replacement instead of leaking.
  const previewUrl = useMemo(
    () =>
      coverImageFile
        ? URL.createObjectURL(coverImageFile)
        : null,
    [coverImageFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (event) => {
    setLocalError("");
    dispatch(clearCreateLocationError());

    setFormData((currentData) => ({
      ...currentData,
      [event.target.name]: event.target.value,
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

    setLocalError("");
    dispatch(clearCreateLocationError());

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setLocalError(
        "Please choose a JPEG, PNG or WebP image."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setLocalError(
        "Image is too large. Please choose a file under 5MB."
      );
      return;
    }

    setCoverImageFile(file);
  };

  const handleRemoveImage = () => {
    setCoverImageFile(null);
  };

  const handlePlaceChange = (nextPlaceData) => {
    setLocalError("");
    dispatch(clearCreateLocationError());

    setPlaceData(nextPlaceData);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!placeData.address.trim()) {
      setLocalError("Address is required.");
      return;
    }

    if (!placeData.isValid) {
      setLocalError(
        "Please select an address from the suggestions."
      );
      return;
    }

    const locationFormData = new FormData();

    locationFormData.append(
      "title",
      formData.title.trim()
    );

    locationFormData.append(
      "address",
      placeData.address.trim()
    );

    if (placeData.placeName) {
      locationFormData.append(
        "placeName",
        placeData.placeName
      );
    }

    if (typeof placeData.lat === "number") {
      locationFormData.append(
        "lat",
        placeData.lat
      );
    }

    if (typeof placeData.lng === "number") {
      locationFormData.append(
        "lng",
        placeData.lng
      );
    }

    if (placeData.placeId) {
      locationFormData.append(
        "placeId",
        placeData.placeId
      );
    }

    if (formData.visitedAt) {
      locationFormData.append(
        "visitedAt",
        formData.visitedAt
      );
    }

    if (coverImageFile) {
      locationFormData.append(
        "coverImage",
        coverImageFile
      );
    }

    try {
      // Do NOT set a Content-Type header - Axios computes the
      // multipart boundary itself when the body is a FormData instance.
      await dispatch(
        createLocation({
          tripId,
          locationData: locationFormData,
        })
      ).unwrap();

      navigate(`/trips/${tripId}`, {
        replace: true,
        state: {
          message:
            "Location added successfully.",
        },
      });
    } catch {
      // Redux stores and displays the server error.
    }
  };

  return (
    <main className="add-location-page">
      <div className="add-location-shell">
        <section className="add-location-introduction">
          <Link
            to={`/trips/${tripId}`}
            className="add-location-back"
          >
            <ArrowLeft size={18} />
            Back to trip
          </Link>

          <span className="section-kicker">
            Add a new place
          </span>

          <h1>Mark a location.</h1>

          <p>
            Add a place visited during the trip.
            Later, memories, photos and shared
            experiences will be attached to this
            location.
          </p>

          <div className="add-location-feature-list">
            <article>
              <span>
                <MapPin size={21} />
              </span>

              <div>
                <strong>Place information</strong>
                <p>
                  Enter the full address of the
                  place you visited.
                </p>
              </div>
            </article>

            <article>
              <span>
                <CalendarDays size={21} />
              </span>

              <div>
                <strong>Visit date</strong>
                <p>
                  Add the date to preserve the
                  journey timeline.
                </p>
              </div>
            </article>
          </div>
        </section>

        <section className="add-location-card">
          <div className="add-location-card-heading">
            <span className="add-location-heading-icon">
              <MapPin size={25} />
            </span>

            <div>
              <h2>Location details</h2>
              <p>
                Fields marked as required must be
                completed.
              </p>
            </div>
          </div>

          {(localError ||
            createLocationError) && (
            <div className="form-error">
              {localError ||
                createLocationError}
            </div>
          )}

          <form
            className="add-location-form"
            onSubmit={handleSubmit}
          >
            <label>
              Custom title
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Sunset at the viewpoint"
                maxLength={100}
              />

              <small>
                Optional. This can describe your
                experience at the place.
              </small>
            </label>

            <AddressAutocomplete
              id="address"
              label="Full address"
              placeholder="Arizona, United States"
              required
              onChange={handlePlaceChange}
            />

            <label>
              Date visited
              <input
                type="date"
                name="visitedAt"
                value={formData.visitedAt}
                onChange={handleChange}
              />
            </label>

            <div className="add-location-cover-field">
              <span className="add-location-cover-label">
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
                className="button button-secondary add-location-upload-button"
                onClick={handlePickImage}
              >
                <Image size={17} />
                {coverImageFile
                  ? "Change image"
                  : "Choose image"}
              </button>

              <small>
                Optional. JPEG, PNG or WebP, up to 5MB.
              </small>
            </div>

            {previewUrl && (
              <div className="add-location-preview">
                <img
                  src={previewUrl}
                  alt="Location cover preview"
                />

                <button
                  type="button"
                  className="add-location-preview-remove"
                  aria-label="Remove selected image"
                  onClick={handleRemoveImage}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="add-location-actions">
              <Link
                to={`/trips/${tripId}`}
                className="button button-secondary"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="button button-primary"
                disabled={creatingLocation}
              >
                {creatingLocation
                  ? "Adding location..."
                  : "Add location"}

                {!creatingLocation && (
                  <Plus size={18} />
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default AddLocation;
