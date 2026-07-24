import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { APIProvider } from "@vis.gl/react-google-maps";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { store } from "./store/store";

import "./index.css";

// Mounted once, here, so the Google Maps JS script is loaded exactly
// once for the whole app - both this phase's address autocomplete and
// the later map page share this same provider/script instance instead
// of each risking a duplicate script tag. An empty string is a valid,
// safe value when the key isn't configured yet (e.g. a fresh clone
// before Google Cloud setup) - APIProvider simply never loads the
// script, and GoogleAddressAutocomplete detects that and shows a
// friendly message instead of a broken map/console error.
const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <App />
          </APIProvider>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);