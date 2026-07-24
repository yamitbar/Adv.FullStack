import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

// Module-level, idempotent registration of Google's documented global
// auth-failure callback. Google calls `window.gm_authFailure` at most
// once, globally, whenever the Maps JS script loads but the API key is
// invalid, unrestricted in a way Google rejects, or billing isn't
// enabled. We register the callback exactly once for the whole app
// (guarding with `if (!window.gm_authFailure)`) and fan it out to every
// mounted instance of this component through a small listener set, so
// two instances (e.g. this component plus a future map page) never
// clobber each other's handler.
const authFailureListeners = new Set();
if (typeof window !== "undefined" && !window.gm_authFailure) {
  window.gm_authFailure = () => {
    authFailureListeners.forEach((listener) => listener());
  };
}

const EMPTY_PLACE = {
  address: "",
  placeName: "",
  lat: null,
  lng: null,
  googlePlaceId: "",
};

/**
 * Reusable Google Places address autocomplete field.
 *
 * Shows a single address text input (no separate place-name, lat, lng,
 * or place-ID fields are ever rendered). While the user types, Google
 * shows its own suggestion dropdown; selecting a suggestion captures
 * the formatted address, place name, coordinates, and Google Place ID
 * internally and reports them to the parent via `onChange`. Raw
 * coordinates, the Place ID, and any technical Google error are never
 * shown in the UI - only friendly status text.
 *
 * The input is intentionally uncontrolled (a plain DOM ref): Google's
 * Autocomplete widget manipulates the input's DOM value directly when
 * a suggestion is chosen, which conflicts with React re-rendering a
 * controlled `value` prop on every keystroke. This matches Google's
 * own official React sample for this widget.
 *
 * Stale-coordinate prevention: `lastValidPlaceRef` tracks the address
 * text that is currently "trustworthy" - either the seeded initial
 * address (edit mode, untouched) or the address text exactly as it
 * stood right after a Google `place_changed` event. Every native
 * `input` event compares the live text against that trusted value: if
 * it still matches, the last trusted metadata is reported again; if it
 * no longer matches (the user is typing something new, whether from
 * scratch or by editing a previously-selected address), metadata is
 * cleared and `isValid` is reported as false. The parent form is
 * expected to block submission when `isValid` is false and the
 * address text is non-empty, and to only send placeName/lat/lng/
 * googlePlaceId to the backend when `isValid` is true.
 *
 * Props:
 * - id, label, placeholder, required: standard field presentation.
 * - initialAddress: existing address text to preload (edit mode).
 * - initialPlace: `{ placeName, lat, lng, googlePlaceId } | null` -
 *   existing metadata to preload alongside initialAddress so that
 *   saving an edit without touching the address preserves it,
 *   including for old pre-autocomplete records where this is null.
 * - onChange({ address, placeName, lat, lng, googlePlaceId, isValid }):
 *   called on mount (with the seeded state) and on every subsequent
 *   change.
 */
export default function GoogleAddressAutocomplete({
  id = "address",
  label = "Full address",
  placeholder = "Arizona, United States",
  required = false,
  initialAddress = "",
  initialPlace = null,
  onChange,
  className,
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const lastValidPlaceRef = useRef({ ...EMPTY_PLACE, address: initialAddress });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const apiKeyPresent = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  // "loading" while the Places library is being fetched, "ready" once
  // the Autocomplete widget is wired up, "unavailable" if there is no
  // API key configured or Google reports an auth/billing failure. In
  // every state other than "ready", we cannot require the user to pick
  // a Google suggestion (none are being offered), so any typed address
  // is treated as valid and simply saved without coordinates - the
  // same behavior the app had before this feature existed.
  const [status, setStatus] = useState(apiKeyPresent ? "loading" : "unavailable");

  const placesLib = useMapsLibrary("places");

  // Seed the input's DOM value and the "last trusted" metadata once on
  // mount, then report that initial state to the parent. Intentionally
  // runs only once: this component is remounted (not re-rendered in
  // place) whenever the parent switches between a fresh Add form and
  // an Edit form for a different location, so a single mount-time seed
  // is sufficient.
  useEffect(() => {
    const seeded = {
      address: initialAddress,
      placeName: initialPlace?.placeName || "",
      lat: typeof initialPlace?.lat === "number" ? initialPlace.lat : null,
      lng: typeof initialPlace?.lng === "number" ? initialPlace.lng : null,
      googlePlaceId: initialPlace?.googlePlaceId || "",
    };
    lastValidPlaceRef.current = seeded;
    if (inputRef.current) {
      inputRef.current.value = initialAddress;
    }
    onChangeRef.current?.({ ...seeded, isValid: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for Google's global auth-failure callback for the lifetime
  // of this instance.
  useEffect(() => {
    const handleAuthFailure = () => setStatus("unavailable");
    authFailureListeners.add(handleAuthFailure);
    return () => authFailureListeners.delete(handleAuthFailure);
  }, []);

  // Wire up the Autocomplete widget once the Places library and the
  // input element are both available.
  useEffect(() => {
    const inputEl = inputRef.current;
    if (!apiKeyPresent || !placesLib || !inputEl || autocompleteRef.current) {
      return undefined;
    }

    const autocomplete = new placesLib.Autocomplete(inputEl, {
      // Keep the requested place-details fields minimal - only what
      // this app actually stores/uses.
      fields: ["place_id", "name", "formatted_address", "geometry"],
    });
    autocompleteRef.current = autocomplete;
    setStatus("ready");

    const placeChangedListener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const lat = place?.geometry?.location?.lat?.();
      const lng = place?.geometry?.location?.lng?.();
      const hasCoords =
        typeof lat === "number" &&
        typeof lng === "number" &&
        Number.isFinite(lat) &&
        Number.isFinite(lng);

      // Google has already updated the input's DOM value by the time
      // this event fires; reading it back (rather than trusting
      // place.formatted_address to match byte-for-byte) is what lets
      // the "input" listener below correctly detect later edits.
      const confirmedAddress = inputEl.value;

      const confirmed = {
        address: confirmedAddress,
        placeName: place?.name || "",
        lat: hasCoords ? lat : null,
        lng: hasCoords ? lng : null,
        googlePlaceId: place?.place_id || "",
      };
      lastValidPlaceRef.current = confirmed;
      onChangeRef.current?.({ ...confirmed, isValid: true });
    });

    const handleInput = () => {
      const currentValue = inputEl.value;
      if (currentValue === lastValidPlaceRef.current.address) {
        // Text still matches the last confirmed/seeded selection -
        // nothing has actually changed, keep reporting it as valid.
        onChangeRef.current?.({ ...lastValidPlaceRef.current, isValid: true });
      } else {
        // The user is typing something new (from scratch, or editing
        // text after a previous selection). Clear the metadata so a
        // stale place is never attached to a different address.
        onChangeRef.current?.({ ...EMPTY_PLACE, address: currentValue, isValid: false });
      }
    };
    inputEl.addEventListener("input", handleInput);

    return () => {
      inputEl.removeEventListener("input", handleInput);
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(placeChangedListener);
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
      autocompleteRef.current = null;
    };
  }, [apiKeyPresent, placesLib]);

  return (
    <label htmlFor={id} className={className}>
      {label}
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={id}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        defaultValue={initialAddress}
      />
      {status === "loading" && (
        <small aria-live="polite">Loading address suggestions…</small>
      )}
      {status === "unavailable" && (
        <small aria-live="polite">
          Address suggestions are unavailable right now — you can still type the address manually.
        </small>
      )}
    </label>
  );
}
