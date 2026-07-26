import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  CalendarDays,
  CircleAlert,
  MapPin,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";
import { fetchTrips } from "../store/slices/tripsSlice";

import "./Map.css";

// Leaflet's default marker icon paths don't resolve once bundled by
// Vite - re-pointing it at Vite-processed image imports fixes it.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;
const SINGLE_MARKER_ZOOM = 12;

function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

// Child of MapContainer (needs the map instance via useMap). Adjusts
// the existing map's view when the marker set changes, instead of
// recreating MapContainer itself.
function FitBoundsToMarkers({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    if (locations.length === 1) {
      map.setView(
        [locations[0].lat, locations[0].lng],
        SINGLE_MARKER_ZOOM
      );
      return;
    }

    const bounds = L.latLngBounds(
      locations.map((location) => [
        location.lat,
        location.lng,
      ])
    );

    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, locations]);

  return null;
}

function Map() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const {
    items: trips,
    loading: tripsLoading,
    error: tripsError,
  } = useSelector((state) => state.trips);

  const [locationsByTrip, setLocationsByTrip] =
    useState({});
  const [locationsLoading, setLocationsLoading] =
    useState(false);
  const [locationsError, setLocationsError] =
    useState("");
  const fetchedTripIdsRef = useRef("");

  // Identifies the most recently started locations fetch so a
  // superseded request can skip applying its result. Used instead of an
  // effect-cleanup "cancelled" flag, which React Strict Mode's
  // synthetic dev-mode double-invoke previously caused to leave
  // `locationsLoading` stuck true forever.
  const requestIdRef = useRef(0);

  // True only while genuinely mounted (not Strict Mode's synthetic
  // double-invoke) - guards against updating state after leaving the page.
  const isMountedRef = useRef(true);

  const [selectedTripId, setSelectedTripId] =
    useState("all");
  const preselectAppliedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  // Fetches every accessible trip's locations in parallel (no bulk "all
  // my locations" endpoint exists). Kept in local state rather than
  // Redux's single-trip `selectedTripLocations` slot.
  useEffect(() => {
    if (tripsLoading) {
      return;
    }

    if (trips.length === 0) {
      // Nothing to fetch - make sure the page can never get stuck on
      // the loading state waiting for a request that will never
      // start (e.g. every trip was deleted after an earlier fetch).
      setLocationsLoading(false);
      return;
    }

    const idsKey = trips
      .map((trip) => trip._id)
      .sort()
      .join(",");

    if (fetchedTripIdsRef.current === idsKey) {
      return;
    }

    fetchedTripIdsRef.current = idsKey;

    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;
    const isCurrentRequest = () =>
      isMountedRef.current &&
      requestIdRef.current === thisRequestId;

    setLocationsLoading(true);
    setLocationsError("");

    const loadAllLocations = async () => {
      try {
        const results = await Promise.allSettled(
          trips.map((trip) =>
            api
              .get(`/trips/${trip._id}/locations`)
              .then((response) => ({
                tripId: trip._id,
                // The endpoint's success shape is always
                // { success, count, locations: [...] } - never a
                // bare array or a `data`-wrapped payload.
                locations:
                  response.data.locations || [],
              }))
          )
        );

        if (!isCurrentRequest()) {
          return;
        }

        const nextMap = {};
        let anyFailed = false;

        results.forEach((result, index) => {
          const tripId = trips[index]._id;

          if (result.status === "fulfilled") {
            nextMap[tripId] = result.value.locations;
          } else {
            anyFailed = true;
            nextMap[tripId] = [];
          }
        });

        setLocationsByTrip(nextMap);

        if (anyFailed) {
          setLocationsError(
            "Some trips' locations could not be loaded. Pull-to-refresh or reload the page to try again."
          );
        }
      } catch {
        // Promise.allSettled itself never rejects, but guard against
        // an unexpected synchronous error above it anyway so this
        // request still always resolves the loading state below.
        if (isCurrentRequest()) {
          setLocationsError(
            "Locations could not be loaded. Reload the page to try again."
          );
        }
      } finally {
        if (isCurrentRequest()) {
          setLocationsLoading(false);
        }
      }
    };

    loadAllLocations();
  }, [trips, tripsLoading]);

  // Optionally preselect a trip from ?trip=<id> (e.g. a "View on Map"
  // link from Trip Details). Only applied once, and only if the id
  // actually matches one of the user's accessible trips.
  useEffect(() => {
    if (
      preselectAppliedRef.current ||
      trips.length === 0
    ) {
      return;
    }

    const requestedTripId = searchParams.get("trip");

    if (
      requestedTripId &&
      trips.some(
        (trip) => trip._id === requestedTripId
      )
    ) {
      setSelectedTripId(requestedTripId);
    }

    preselectAppliedRef.current = true;
  }, [trips, searchParams]);

  const visibleLocations = useMemo(() => {
    const relevantTrips =
      selectedTripId === "all"
        ? trips
        : trips.filter(
            (trip) => trip._id === selectedTripId
          );

    const result = [];

    relevantTrips.forEach((trip) => {
      const tripLocations =
        locationsByTrip[trip._id] || [];

      tripLocations.forEach((location) => {
        const lat =
          typeof location.lat === "number" &&
          Number.isFinite(location.lat)
            ? location.lat
            : null;

        const lng =
          typeof location.lng === "number" &&
          Number.isFinite(location.lng)
            ? location.lng
            : null;

        if (lat === null || lng === null) {
          // Old or manually-typed locations without coordinates are
          // simply not shown as markers - they remain fully usable
          // everywhere else in the app.
          return;
        }

        result.push({
          ...location,
          lat,
          lng,
          tripTitle: trip.title,
        });
      });
    });

    return result;
  }, [trips, locationsByTrip, selectedTripId]);

  const totalLocationCount = useMemo(
    () =>
      Object.values(locationsByTrip).reduce(
        (sum, list) => sum + list.length,
        0
      ),
    [locationsByTrip]
  );

  const isInitialLoading =
    tripsLoading ||
    (trips.length > 0 &&
      locationsLoading &&
      Object.keys(locationsByTrip).length === 0);

  if (isInitialLoading) {
    return (
      <main className="map-page">
        <section className="map-state">
          <div className="loader-spinner" />
          <h1>Loading your map...</h1>
          <p>Gathering your trips and locations.</p>
        </section>
      </main>
    );
  }

  if (tripsError) {
    return (
      <main className="map-page">
        <section className="map-state">
          <span className="map-state-icon error">
            <CircleAlert size={30} />
          </span>

          <h1>We could not load your trips</h1>
          <p>{tripsError}</p>

          <button
            type="button"
            className="button button-primary"
            onClick={() => dispatch(fetchTrips())}
          >
            <RefreshCw size={18} />
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (trips.length === 0) {
    return (
      <main className="map-page">
        <section className="map-state">
          <span className="map-state-icon">
            <MapPin size={30} />
          </span>

          <h1>No trips yet</h1>
          <p>
            Create a trip or join one with an invite
            code to start seeing locations on the map.
          </p>

          <Link
            to="/trips"
            className="button button-primary"
          >
            Go to My Trips
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="map-page">
      <div className="map-page-heading">
        <div>
          <span className="section-kicker">
            Every stop, on one map
          </span>
          <h1>Trip map</h1>
        </div>

        <div className="map-filter">
          <label htmlFor="map-trip-filter">
            Filter by trip
          </label>

          <select
            id="map-trip-filter"
            value={selectedTripId}
            onChange={(event) =>
              setSelectedTripId(event.target.value)
            }
          >
            <option value="all">All trips</option>

            {trips.map((trip) => (
              <option
                key={trip._id}
                value={trip._id}
              >
                {trip.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {locationsError && (
        <div className="form-error map-inline-error">
          {locationsError}
        </div>
      )}

      {totalLocationCount === 0 && (
        <div className="map-empty-note">
          <MapPin size={18} />
          No locations with a saved address yet. New
          locations you add through the address
          suggestions will appear here automatically.
        </div>
      )}

      {totalLocationCount > 0 &&
        visibleLocations.length <
          totalLocationCount &&
        selectedTripId === "all" && (
          <p className="map-coverage-note">
            Showing {visibleLocations.length} of{" "}
            {totalLocationCount} locations - the rest
            don&apos;t have a saved address yet.
          </p>
        )}

      <div className="map-container">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsToMarkers
            locations={visibleLocations}
          />

          {visibleLocations.map((location) => (
            <Marker
              key={location._id}
              position={[
                location.lat,
                location.lng,
              ]}
            >
              <Popup>
                <div className="map-popup">
                  <strong>
                    {location.title ||
                      location.placeName ||
                      location.address}
                  </strong>

                  <span className="map-popup-address">
                    {location.address}
                  </span>

                  <span className="map-popup-trip">
                    {location.tripTitle}
                  </span>

                  {formatDate(
                    location.visitedAt
                  ) && (
                    <span className="map-popup-date">
                      <CalendarDays size={13} />
                      {formatDate(
                        location.visitedAt
                      )}
                    </span>
                  )}

                  <Link
                    to={`/locations/${location._id}`}
                    className="map-popup-link"
                  >
                    View location
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </main>
  );
}

export default Map;
