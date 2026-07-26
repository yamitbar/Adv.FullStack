import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchAddressSuggestions,
  isGeoapifyConfigured,
  isRequestCanceled,
} from "../../services/geoapify";

import "./AddressAutocomplete.css";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_DELAY_MS = 300;

const EMPTY_PLACE = {
  address: "",
  placeName: "",
  lat: null,
  lng: null,
  placeId: "",
};

// Picks the best available short label for a Geoapify result - `name`
// is usually empty for a plain street address, so this falls back to
// the formatted address, then the city, rather than showing nothing.
function pickPlaceName(result) {
  return (
    result.name ||
    result.address_line1 ||
    result.city ||
    ""
  );
}

// Reusable Geoapify address autocomplete field. Reports
// `onChange({ address, placeName, lat, lng, placeId, isValid })` on
// every change; `isValid: false` means typed text with no confirmed
// coordinates (blocks submission upstream), except when Geoapify itself
// is unavailable, where free text is reported as valid with no
// coordinates instead. `lastValidPlaceRef` invalidates stale coordinates
// once the text no longer matches the last confirmed/seeded address.
export default function AddressAutocomplete({
  id = "address",
  label = "Full address",
  placeholder = "Arizona, United States",
  required = false,
  initialAddress = "",
  initialPlace = null,
  onChange,
  className,
}) {
  const [inputValue, setInputValue] = useState(
    initialAddress
  );
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(
    false
  );
  const [activeIndex, setActiveIndex] = useState(-1);

  // Mirrors whatever was last reported via onChange, so this component
  // can render its own "no coordinates saved" hint without the parent
  // having to pass state back down.
  const [reportedPlace, setReportedPlace] = useState({
    ...EMPTY_PLACE,
    address: initialAddress,
    isValid: true,
  });

  // "idle" | "loading" | "no-results" | "error" | "missing-key"
  const [status, setStatus] = useState(() =>
    isGeoapifyConfigured() ? "idle" : "missing-key"
  );

  const lastValidPlaceRef = useRef({
    ...EMPTY_PLACE,
    address: initialAddress,
  });
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const listboxId = `${id}-listbox`;

  // Seed the "last trusted" metadata once on mount and report it to
  // the parent. Runs only once: this component is remounted (not
  // re-rendered in place) whenever the parent switches between a
  // fresh Add form and an Edit form for a different location.
  useEffect(() => {
    const seeded = {
      address: initialAddress,
      placeName: initialPlace?.placeName || "",
      lat:
        typeof initialPlace?.lat === "number"
          ? initialPlace.lat
          : null,
      lng:
        typeof initialPlace?.lng === "number"
          ? initialPlace.lng
          : null,
      placeId: initialPlace?.placeId || "",
    };
    lastValidPlaceRef.current = seeded;
    setReportedPlace({ ...seeded, isValid: true });
    onChangeRef.current?.({ ...seeded, isValid: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up any pending debounce/in-flight request on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const runSearch = (query) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus("loading");

    fetchAddressSuggestions(query, {
      signal: controller.signal,
    })
      .then((results) => {
        setSuggestions(results);
        setStatus(
          results.length > 0 ? "idle" : "no-results"
        );
        setShowDropdown(true);
        setActiveIndex(-1);
      })
      .catch((error) => {
        if (isRequestCanceled(error)) {
          // A newer keystroke superseded this request - the newer
          // request's own handler already owns the current state.
          return;
        }

        setSuggestions([]);
        setStatus(
          error?.code === "MISSING_API_KEY"
            ? "missing-key"
            : "error"
        );
        setShowDropdown(false);
      });
  };

  const handleInputChange = (event) => {
    const value = event.target.value;
    setInputValue(value);

    const matchesConfirmed =
      value === lastValidPlaceRef.current.address;
    const autocompleteDegraded =
      status === "missing-key" || status === "error";

    if (matchesConfirmed) {
      const next = { ...lastValidPlaceRef.current, isValid: true };
      setReportedPlace(next);
      onChangeRef.current?.(next);
    } else if (autocompleteDegraded) {
      // Geoapify is unavailable this session - fall back to plain
      // text entry rather than blocking the form.
      const next = { ...EMPTY_PLACE, address: value, isValid: true };
      setReportedPlace(next);
      onChangeRef.current?.(next);
    } else {
      const next = { ...EMPTY_PLACE, address: value, isValid: false };
      setReportedPlace(next);
      onChangeRef.current?.(next);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmed = value.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortControllerRef.current?.abort();
      setSuggestions([]);
      setShowDropdown(false);
      setActiveIndex(-1);
      if (status !== "missing-key") {
        setStatus("idle");
      }
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      runSearch(trimmed);
    }, DEBOUNCE_DELAY_MS);
  };

  const selectSuggestion = (index) => {
    const result = suggestions[index];

    if (!result) {
      return;
    }

    const lat =
      typeof result.lat === "number" ? result.lat : null;
    // Geoapify's coordinate field is "lon", not "lng" - normalized
    // here to lng to match Pathly's own field name.
    const lng =
      typeof result.lon === "number" ? result.lon : null;

    const confirmed = {
      address: result.formatted || inputValue,
      placeName: pickPlaceName(result),
      lat,
      lng,
      placeId: result.place_id || "",
    };

    lastValidPlaceRef.current = confirmed;
    setInputValue(confirmed.address);
    setReportedPlace({ ...confirmed, isValid: true });
    onChangeRef.current?.({
      ...confirmed,
      isValid: true,
    });

    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (
      !showDropdown ||
      suggestions.length === 0
    ) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        current < suggestions.length - 1
          ? current + 1
          : 0
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current > 0
          ? current - 1
          : suggestions.length - 1
      );
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        selectSuggestion(activeIndex);
      }
    } else if (event.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  };

  const handleBlur = () => {
    // Suggestion items use onMouseDown+preventDefault (below) so a
    // click on one never actually blurs the input first - this can
    // safely close the dropdown on every other blur cause.
    setShowDropdown(false);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <label
      htmlFor={id}
      className={className}
    >
      {label}

      <div className="address-autocomplete">
        <input
          id={id}
          name={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0
              ? `${id}-option-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          placeholder={placeholder}
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {showDropdown && suggestions.length > 0 && (
          <ul
            className="address-autocomplete-list"
            role="listbox"
            id={listboxId}
          >
            {suggestions.map((result, index) => (
              <li
                key={
                  result.place_id ||
                  `${result.formatted}-${index}`
                }
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? "address-autocomplete-option address-autocomplete-option-active"
                    : "address-autocomplete-option"
                }
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={() =>
                  selectSuggestion(index)
                }
              >
                {result.formatted}
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === "loading" && (
        <small className="address-autocomplete-status" aria-live="polite">
          Searching addresses…
        </small>
      )}

      {status === "no-results" && (
        <small className="address-autocomplete-status" aria-live="polite">
          No addresses found. Try a more specific search.
        </small>
      )}

      {status === "error" && (
        <small className="address-autocomplete-status" aria-live="polite">
          Address suggestions are unavailable right now — you can
          still type the address manually.
        </small>
      )}

      {status === "missing-key" && (
        <small className="address-autocomplete-status" aria-live="polite">
          Address suggestions are not configured yet — you can still
          type the address manually.
        </small>
      )}

      {reportedPlace.isValid &&
        inputValue.trim().length > 0 &&
        !(
          typeof reportedPlace.lat === "number" &&
          typeof reportedPlace.lng === "number"
        ) && (
          <small className="address-autocomplete-hint" aria-live="polite">
            This address was not found on the map. You can still save
            it as free text, but this location will not appear on the
            map.
          </small>
        )}
    </label>
  );
}
