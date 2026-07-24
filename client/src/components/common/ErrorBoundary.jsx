import { Component } from "react";
import {
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import "./ErrorBoundary.css";

/**
 * Top-level React Error Boundary. Catches unexpected render/lifecycle
 * errors anywhere below it in the tree and shows a friendly fallback
 * instead of a blank white page.
 *
 * This is a different safety net from the app's normal API error
 * states (a failed fetch showing a `*-error-state` block with a retry
 * button, e.g. in MyTrips/TripDetails/LocationDetails) - those handle
 * expected, recoverable failures without ever unmounting the page.
 * This only fires for a genuine unexpected JavaScript error while
 * rendering, which those per-page states cannot catch.
 *
 * Must be a class component: `getDerivedStateFromError` and
 * `componentDidCatch` have no Hook equivalent in React yet.
 */
class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error(
      "Unhandled render error caught by ErrorBoundary:",
      error,
      info
    );
  }

  // Full page navigations on purpose, not client-side router
  // navigation: this component's own error state only clears on
  // remount, so a normal client-side route change would leave the
  // fallback showing even after the URL changed underneath it. A full
  // navigation/reload guarantees a clean slate.
  handleReturnHome = () => {
    window.location.href = "/";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="error-boundary-page">
        <div className="error-boundary-content">
          <span className="error-boundary-icon">
            <AlertTriangle size={30} />
          </span>

          <h1>Something went wrong.</h1>

          <p>
            An unexpected error interrupted this
            page. Head back to Home, or reload to
            try again.
          </p>

          {import.meta.env.DEV &&
            this.state.error && (
              <pre className="error-boundary-detail">
                {String(
                  this.state.error?.message ||
                    this.state.error
                )}
              </pre>
            )}

          <div className="error-boundary-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={this.handleReturnHome}
            >
              Return home
            </button>

            <button
              type="button"
              className="button button-secondary"
              onClick={this.handleReload}
            >
              <RotateCcw size={17} />
              Reload page
            </button>
          </div>
        </div>
      </section>
    );
  }
}

export default ErrorBoundary;
