import axios from "axios";

// A dedicated axios instance (not ../services/api's `api`), since
// requests go directly from the browser to Geoapify and must never
// carry our own backend's JWT header.
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
