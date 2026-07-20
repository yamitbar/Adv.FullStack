import {
  Crown,
  User,
  X,
} from "lucide-react";

import { getTravelerList } from "../../utils/normalizeId";

import "./ParticipantsModal.css";

// Simple read-only display of who is on a trip - the creator plus every
// unique participant, by name. No removal, roles, or invitations here;
// that is explicitly out of scope for this MVP.
function ParticipantsModal({ trip, onClose }) {
  const travelers = getTravelerList(trip);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="participants-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="participants-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="participants-title"
      >
        <button
          type="button"
          className="participants-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <h2 id="participants-title">
          Travelers on this trip
        </h2>

        <p>
          {travelers.length} traveler
          {travelers.length === 1 ? "" : "s"} on this
          journey.
        </p>

        <ul className="participants-list">
          {travelers.map((traveler) => (
            <li key={traveler._id}>
              <span className="participants-list-avatar">
                <User size={16} />
              </span>

              <span className="participants-list-name">
                {traveler.name}
              </span>

              {traveler.isCreator && (
                <span className="participants-list-badge">
                  <Crown size={12} />
                  Trip creator
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ParticipantsModal;
