import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  CalendarDays,
  Image,
  MapPin,
  Plus,
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

import GoogleAddressAutocomplete from "../components/locations/GoogleAddressAutocomplete";

import "./AddLocation.css";

const initialFormData = {
  title: "",
  coverImage: "",
  visitedAt: "",
};

// Internal Google place metadata for the address field. This is never
// rendered directly - only `address` is shown to the user, via the
// GoogleAddressAutocomplete component. `isValid` tracks whether the
// current address text is a trustworthy Google selection (or, for a
// fresh Add form, simply unset); see GoogleAddressAutocomplete's own
// comments for the full stale-address-prevention design.
const initialPlaceData = {
  address: "",
  placeName: "",
  lat: null,
  lng: null,
  googlePlaceId: "",
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

  const [localError, setLocalError] =
    useState("");

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

  const handleChange = (event) => {
    setLocalError("");
    dispatch(clearCreateLocationError());

    setFormData((currentData) => ({
      ...currentData,
      [event.target.name]: event.target.value,
    }));
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

    const locationData = {
      title: formData.title.trim(),
      address: placeData.address.trim(),
      coverImage: formData.coverImage.trim(),
    };

    if (placeData.placeName) {
      locationData.placeName = placeData.placeName;
    }

    if (typeof placeData.lat === "number") {
      locationData.lat = placeData.lat;
    }

    if (typeof placeData.lng === "number") {
      locationData.lng = placeData.lng;
    }

    if (placeData.googlePlaceId) {
      locationData.googlePlaceId = placeData.googlePlaceId;
    }

    if (formData.visitedAt) {
      locationData.visitedAt =
        formData.visitedAt;
    }

    try {
      await dispatch(
        createLocation({
          tripId,
          locationData,
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

            <GoogleAddressAutocomplete
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

            <label>
              Cover image URL
              <div className="input-with-icon">
                <Image size={18} />

                <input
                  type="url"
                  name="coverImage"
                  value={formData.coverImage}
                  onChange={handleChange}
                  placeholder="https://example.com/location.jpg"
                />
              </div>
            </label>

            {formData.coverImage && (
              <div className="add-location-preview">
                <img
                  src={formData.coverImage}
                  alt="Location cover preview"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
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
