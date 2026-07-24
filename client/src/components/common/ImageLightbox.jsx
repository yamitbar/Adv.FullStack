import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import "./ImageLightbox.css";

/**
 * Minimal full-size image viewer. Renders via a portal to
 * document.body (so its overlay always sits above the rest of the
 * page regardless of where the triggering thumbnail lives in the
 * DOM). Deliberately simple: no zoom, swipe, slideshow, or editing -
 * just a large view of one image with a dark backdrop.
 *
 * Closes on: the close button, the Escape key, or a click on the
 * backdrop itself. A click on the image does not close it (the click
 * handler that would close the overlay lives on the backdrop element,
 * and the image stops the click from bubbling to it).
 */
function ImageLightbox({ src, alt, onClose }) {
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    previouslyFocusedRef.current =
      document.activeElement;
    closeButtonRef.current?.focus();

    const previousOverflow =
      document.body.style.overflow;
    document.body.style.overflow = "hidden";

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
      document.body.style.overflow =
        previousOverflow;
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
