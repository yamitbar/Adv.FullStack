import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Manual QA found that navigating between routes (e.g. Trip Details ->
// Add Location) sometimes opens the new page at the previous page's
// scroll position instead of the top. React Router does not reset
// scroll on navigation by default, so this resets it once, globally,
// on every pathname change.
//
// Renders nothing - mount it once at the routing level (see App.jsx).
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // "instant" (not "smooth") so it reads as a normal fresh page load
    // rather than an animated scroll. Some older browsers only support
    // the non-options window.scrollTo(x, y) form, so fall back to that
    // if the options-object form throws.
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

export default ScrollToTop;
