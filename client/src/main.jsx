import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { store } from "./store/store";

import "./index.css";

// Leaflet's own stylesheet, imported exactly once here at the app's
// single entry point (the same pattern as index.css) rather than from
// the Map page itself - importing it from a lazy-loaded route module
// risks it being pulled in more than once across renders/HMR, and
// every part of the app that ever renders a Leaflet map shares this
// one copy.
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);