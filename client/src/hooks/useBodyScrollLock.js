import { useEffect } from "react";

/**
 * Locks page scrolling (via `document.body.style.overflow`) for as
 * long as `active` is true, and restores whatever overflow value was
 * there before once it becomes false or the component unmounts.
 *
 * Extracted from `ImageLightbox`, which needs exactly this behavior
 * so the page behind its full-screen overlay can't be scrolled while
 * it's open. Written as a small, generic hook (not lightbox-specific)
 * because it's an obvious fit for any future modal/overlay - the
 * project's other two overlays (`JoinTripModal`, `ParticipantsModal`)
 * don't currently lock scroll; this makes it a one-line opt-in if that
 * changes later, without duplicating the same overflow-save/restore
 * logic in each one.
 *
 * @param {boolean} active - whether the lock should currently be applied.
 */
function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}

export default useBodyScrollLock;
