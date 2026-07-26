import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { store } from "./store/store";

import "./index.css";

// Leaflet's stylesheet, imported once here (not from the lazy-loaded
// Map page) so it's never pulled in more than once across renders/HMR.
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