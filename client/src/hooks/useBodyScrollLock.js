import { useEffect } from "react";

// Locks page scrolling while `active` is true, restoring the previous
// overflow value once it becomes false or the component unmounts.
// Extracted from ImageLightbox as a generic hook any modal/overlay can reuse.

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
