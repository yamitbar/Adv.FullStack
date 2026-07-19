import { useState } from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { useNavigate } from "react-router-dom";

import {
  Check,
  Loader2,
  Ticket,
  X,
} from "lucide-react";

import {
  clearJoinTripError,
  joinTrip,
} from "../../store/slices/tripsSlice";

import "./JoinTripModal.css";

function JoinTripModal({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [joinedTrip, setJoinedTrip] = useState(null);

  const { joiningTrip, joinTripError } = useSelector(
    (state) => state.trips
  );

  const handleClose = () => {
    dispatch(clearJoinTripError());
    onClose();
  };

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (joiningTrip) {
      // Prevent duplicate submissions while a request is in flight.
      return;
    }

    const normalizedCode = inviteCode
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      setLocalError("Enter an invite code.");
      return;
    }

    setLocalError("");
    dispatch(clearJoinTripError());

    try {
      const trip = await dispatch(
        joinTrip(normalizedCode)
      ).unwrap();

      setJoinedTrip(trip);

      window.setTimeout(() => {
        navigate(`/trips/${trip._id}`);
      }, 900);
    } catch {
      // Redux stores and displays the error message.
    }
  };

  return (
    <div
      className="join-trip-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="join-trip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-trip-title"
      >
        <button
          type="button"
          className="join-trip-close"
          aria-label="Close"
          onClick={handleClose}
        >
          <X size={18} />
        </button>

        <span className="join-trip-icon">
          <Ticket size={22} />
        </span>

        <h2 id="join-trip-title">
          Join a trip
        </h2>

        <p>
          Enter the invite code shared by the trip
          creator.
        </p>

        {joinedTrip ? (
          <div className="join-trip-success">
            <Check size={20} />
            Joined "{joinedTrip.title}". Taking you
            there...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="join-trip-invite-code">
              Invite code
            </label>

            <input
              id="join-trip-invite-code"
              type="text"
              value={inviteCode}
              onChange={(event) => {
                setInviteCode(event.target.value);
                setLocalError("");
                dispatch(clearJoinTripError());
              }}
              placeholder="PTR-XXXX"
              autoFocus
              autoComplete="off"
              disabled={joiningTrip}
              required
            />

            {(localError || joinTripError) && (
              <div className="form-error">
                {localError || joinTripError}
              </div>
            )}

            <div className="join-trip-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleClose}
                disabled={joiningTrip}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button button-primary"
                disabled={
                  joiningTrip || !inviteCode.trim()
                }
              >
                {joiningTrip ? (
                  <>
                    <Loader2
                      size={17}
                      className="join-trip-spin"
                    />
                    Joining...
                  </>
                ) : (
                  "Join trip"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default JoinTripModal;
