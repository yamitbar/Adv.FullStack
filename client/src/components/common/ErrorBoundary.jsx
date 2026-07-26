import { Component } from "react";
import {
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import "./ErrorBoundary.css";

// Catches unexpected render errors anywhere below it and shows a
// friendly fallback. Must be a class component - no Hook equivalent yet.
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

  // Full page navigation on purpose - the error state only clears on
  // remount, so a client-side route change would leave the fallback showing.
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
