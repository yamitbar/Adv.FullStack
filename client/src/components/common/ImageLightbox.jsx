import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import useBodyScrollLock from "../../hooks/useBodyScrollLock";

import "./ImageLightbox.css";

// Minimal full-size image viewer, rendered via a portal to document.body
// so its overlay always sits above the rest of the page. Closes on the
// close button, Escape, or a backdrop click (not a click on the image
// itself, which stops the click from bubbling to the backdrop).
function ImageLightbox({ src, alt, onClose }) {
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useBodyScrollLock();

  useEffect(() => {
    previouslyFocusedRef.current =
      document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      // Return focus to whatever triggered the viewer (the thumbnail
      // button), if it's still in the document.
      if (
        previouslyFocusedRef.current instanceof
          HTMLElement &&
        document.contains(
          previouslyFocusedRef.current
        )
      ) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [onClose]);

  return createPortal(
    <div
      className="image-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Full-size image"
      onClick={onClose}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="image-lightbox-close"
        aria-label="Close image viewer"
        onClick={onClose}
      >
        <X size={22} />
      </button>

      <img
        src={src}
        alt={alt}
        className="image-lightbox-image"
        onClick={(event) =>
          event.stopPropagation()
        }
      />
    </div>,
    document.body
  );
}

export default ImageLightbox;
