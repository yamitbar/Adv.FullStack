import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Image,
  MapPin,
  Plane,
  X,
} from "lucide-react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  clearCreateTripError,
  createTrip,
} from "../store/slices/tripsSlice";

import "./CreateTrip.css";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function CreateTrip() {
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  const [coverImageFile, setCoverImageFile] =
    useState(null);

  const [localError, setLocalError] =
    useState("");

  const fileInputRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    creating,
    createError,
  } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(clearCreateTripError());
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
    dispatch(clearCreateTripError());

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
    dispatch(clearCreateTripError());

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.endDate) <
        new Date(formData.startDate)
    ) {
      setLocalError(
        "End date cannot be earlier than start date."
      );
      return;
    }

    const tripFormData = new FormData();

    tripFormData.append("title", formData.title.trim());
    tripFormData.append(
      "destination",
      formData.destination.trim()
    );
    tripFormData.append(
      "description",
      formData.description.trim()
    );
    tripFormData.append("startDate", formData.startDate);
    tripFormData.append("endDate", formData.endDate);

    if (coverImageFile) {
      tripFormData.append("coverImage", coverImageFile);
    }

    try {
      // Do NOT set a Content-Type header - Axios computes the
      // multipart boundary itself when the body is a FormData instance.
      await dispatch(
        createTrip(tripFormData)
      ).unwrap();

      navigate("/trips", {
        replace: true,
        state: {
          message: "Trip created successfully.",
        },
      });
    } catch {
      // Redux stores and displays the error message.
    }
  };

  return (
    <main className="create-trip-page">
      <div className="create-trip-shell">
        <section className="create-trip-introduction">
          <Link
            to="/trips"
            className="create-trip-back"
          >
            <ArrowLeft size={18} />
            Back to my trips
          </Link>

          <span className="section-kicker">
            New adventure
          </span>

          <h1>Create a trip.</h1>

          <p>
            Add the basic details now. Locations,
            shared memories and participants can be
            added after the trip is created.
          </p>

          <div className="create-trip-feature-list">
            <div>
              <span>
                <MapPin size={21} />
              </span>

              <div>
                <strong>Choose a destination</strong>
                <p>
                  Give the journey a clear place and
                  identity.
                </p>
              </div>
            </div>

            <div>
              <span>
                <CalendarDays size={21} />
              </span>

              <div>
                <strong>Set the travel dates</strong>
                <p>
                  Build a timeline for locations and
                  memories.
                </p>
              </div>
            </div>

            <div>
              <span>
                <Image size={21} />
              </span>

              <div>
                <strong>Add a cover image</strong>
                <p>
                  Upload an optional photo from your
                  computer to personalize the trip.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="create-trip-card">
          <div className="create-trip-card-heading">
            <span className="create-trip-icon">
              <Plane size={25} />
            </span>

            <div>
              <h2>Trip details</h2>
              <p>
                You can edit these details later.
              </p>
            </div>
          </div>

          {(localError || createError) && (
            <div className="form-error">
              {localError || createError}
            </div>
          )}

          <form
            className="create-trip-form"
            onSubmit={handleSubmit}
          >
            <label>
              Trip title
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="USA Family Adventure"
                maxLength={100}
                required
              />
            </label>

            <label>
              Destination
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="United States"
                maxLength={100}
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="A summer journey filled with places, people and memories."
                rows={5}
                maxLength={500}
              />
            </label>

            <div className="create-trip-date-grid">
              <label>
                Start date
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                End date
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || undefined}
                  required
                />
              </label>
            </div>

            <div className="create-trip-cover-field">
              <span className="create-trip-cover-label">
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
                className="button button-secondary create-trip-upload-button"
                onClick={handlePickImage}
              >
                <Image size={17} />
                {coverImageFile
                  ? "Change image"
                  : "Choose image"}
              </button>
            </div>

            {previewUrl && (
              <div className="create-trip-preview">
                <img
                  src={previewUrl}
                  alt="Trip cover preview"
                />

                <button
                  type="button"
                  className="create-trip-preview-remove"
                  aria-label="Remove selected image"
                  onClick={handleRemoveImage}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="create-trip-actions">
              <Link
                to="/trips"
                className="button button-secondary"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="button button-primary"
                disabled={creating}
              >
                {creating
                  ? "Creating trip..."
                  : "Create trip"}

                {!creating && <Plane size={18} />}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default CreateTrip;