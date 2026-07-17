import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Image,
  MapPin,
  Plane,
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

function CreateTrip() {
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    description: "",
    startDate: "",
    endDate: "",
    coverImage: "",
  });

  const [localError, setLocalError] =
    useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    creating,
    createError,
  } = useSelector((state) => state.trips);

  useEffect(() => {
    dispatch(clearCreateTripError());
  }, [dispatch]);

  const handleChange = (event) => {
    setLocalError("");
    dispatch(clearCreateTripError());

    setFormData((currentData) => ({
      ...currentData,
      [event.target.name]: event.target.value,
    }));
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

    const tripData = {
      title: formData.title.trim(),
      destination: formData.destination.trim(),
      description: formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      coverImage: formData.coverImage.trim(),
    };

    try {
      await dispatch(
        createTrip(tripData)
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
                  Use an optional image URL to
                  personalize the trip.
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

            <label>
              Cover image URL
              <input
                type="url"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="https://example.com/trip-cover.jpg"
              />
            </label>

            {formData.coverImage && (
              <div className="create-trip-preview">
                <img
                  src={formData.coverImage}
                  alt="Trip cover preview"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
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