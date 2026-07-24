import axios from "axios";

// Geoapify is a separate third-party service from the Pathly backend,
// so this is a small, dedicated axios instance rather than a reuse of
// ../services/api's `api` export: that instance points at our own
// backend and automatically attaches our own JWT to every request via
// an interceptor, neither of which should ever happen on a request to
// Geoapify. Requests go directly from the browser to Geoapify (no
// backend proxy) - there is no strong technical reason to route them
// through our server, and Geoapify's own API is designed for direct
// browser use with a restricted, referrer-locked key.
const GEOAPIFY_API_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY || "";

const geoapifyClient = axios.create({
  baseURL: "https://api.geoapify.com/v1",
  timeout: 8000,
});

export function isGeoapifyConfigured() {
  return Boolean(GEOAPIFY_API_KEY);
}

// True if `error` represents a request we deliberately canceled
// ourselves (see AddressAutocomplete's debounce/stale-request
// handling) rather than a real network or service failure.
export function isRequestCanceled(error) {
  return (
    axios.isCancel(error) ||
    error?.code === "ERR_CANCELED" ||
    error?.name === "CanceledError"
  );
}

// Calls Geoapify's Address Autocomplete API and returns its `results`
// array as-is (see https://api.geoapify.com/v1/geocode/autocomplete).
// `signal` should be an AbortController signal so an in-flight request
// can be canceled if the user keeps typing before it resolves.
export async function fetchAddressSuggestions(
  text,
  { signal, limit = 5 } = {}
) {
  if (!GEOAPIFY_API_KEY) {
    const error = new Error(
      "Geoapify API key is not configured"
    );
    error.code = "MISSING_API_KEY";
    throw error;
  }

  const { data } = await geoapifyClient.get(
    "/geocode/autocomplete",
    {
      params: {
        text,
        format: "json",
        limit,
        apiKey: GEOAPIFY_API_KEY,
      },
      signal,
    }
  );

  return Array.isArray(data?.results)
    ? data.results
    : [];
}
