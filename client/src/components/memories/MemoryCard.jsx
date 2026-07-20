import {
  memo,
  useRef,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  CalendarDays,
  ImagePlus,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";

import { resolveMediaUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { isSameEntity } from "../../utils/normalizeId";

import {
  deleteMemory,
  removeMemoryImage,
  updateMemory,
  uploadMemoryImages,
} from "../../store/slices/memoriesSlice";

// Stored image paths always look like "/uploads/<filename>" (see
// memoryController.js). The filename alone is what the remove-image
// route expects.
function getImageFilename(imagePath) {
  return imagePath.split("/").pop();
}

import "./MemoryCard.css";

function formatDateTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function MemoryCard({ memory }) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(
    memory.content || ""
  );

  const {
    updatingMemoryId,
    updateError,
    deletingMemoryId,
    deleteError,
    uploadingMemoryId,
    uploadError,
    removingImage,
    removeImageError,
  } = useSelector((state) => state.memories);

  const isOwner = isSameEntity(
    memory.createdBy,
    user?._id
  );

  const isUpdating = updatingMemoryId === memory._id;
  const isDeleting = deletingMemoryId === memory._id;
  const isUploading = uploadingMemoryId === memory._id;

  const creatorName =
    typeof memory.createdBy === "object" &&
    memory.createdBy?.name
      ? memory.createdBy.name
      : "A trip member";

  const wasEdited =
    memory.updatedAt &&
    memory.createdAt &&
    new Date(memory.updatedAt).getTime() -
      new Date(memory.createdAt).getTime() >
      1000;

  const handleStartEdit = () => {
    setDraftContent(memory.content || "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftContent(memory.content || "");
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!draftContent.trim()) {
      return;
    }

    try {
      await dispatch(
        updateMemory({
          memoryId: memory._id,
          content: draftContent.trim(),
        })
      ).unwrap();

      setIsEditing(false);
    } catch {
      // Redux stores and displays the error message.
    }
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Delete this memory? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    dispatch(deleteMemory(memory._id));
  };

  const handleRemoveImage = (imagePath) => {
    const filename = getImageFilename(imagePath);

    const confirmed = window.confirm(
      "Remove this image? The rest of the memory will stay."
    );

    if (!confirmed) {
      return;
    }

    dispatch(
      removeMemoryImage({
        memoryId: memory._id,
        filename,
      })
    );
  };

  const handlePickImages = () => {
    fileInputRef.current?.click();
  };

  const handleImagesSelected = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    dispatch(
      uploadMemoryImages({
        memoryId: memory._id,
        files,
      })
    );
  };

  return (
    <article className="memory-card">
      <header className="memory-card-header">
        <span className="memory-card-avatar">
          <User size={16} />
        </span>

        <div className="memory-card-meta">
          <strong>{creatorName}</strong>

          <span>
            <CalendarDays size={13} />
            {formatDateTime(memory.createdAt)}
            {wasEdited && " (edited)"}
          </span>
        </div>

        {isOwner && !isEditing && (
          <div className="memory-card-owner-actions">
            <button
              type="button"
              aria-label="Edit memory"
              onClick={handleStartEdit}
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              aria-label="Delete memory"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </header>

      {isEditing ? (
        <form
          className="memory-card-edit-form"
          onSubmit={handleSaveEdit}
        >
          <textarea
            value={draftContent}
            onChange={(event) =>
              setDraftContent(event.target.value)
            }
            rows={3}
            maxLength={2000}
            required
          />

          {updateError &&
            updateError.memoryId === memory._id && (
              <p className="memory-card-error">
                {updateError.message}
              </p>
            )}

          <div className="memory-card-edit-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={
                isUpdating || !draftContent.trim()
              }
            >
              {isUpdating ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      ) : (
        <p className="memory-card-content">
          {memory.content}
        </p>
      )}

      {deleteError &&
        deleteError.memoryId === memory._id && (
          <p className="memory-card-error">
            {deleteError.message}
          </p>
        )}

      {memory.images && memory.images.length > 0 && (
        <div className="memory-card-images">
          {memory.images.map((imagePath) => {
            const filename =
              getImageFilename(imagePath);

            const isRemovingThisImage =
              removingImage?.memoryId === memory._id &&
              removingImage?.filename === filename;

            return (
              <div
                key={imagePath}
                className="memory-card-image"
              >
                <img
                  src={resolveMediaUrl(imagePath)}
                  alt={`Memory photo from ${
                    memory.content || creatorName
                  }`}
                  loading="lazy"
                />

                {isOwner && (
                  <button
                    type="button"
                    className="memory-card-image-remove"
                    aria-label="Remove this image"
                    onClick={() =>
                      handleRemoveImage(imagePath)
                    }
                    disabled={isRemovingThisImage}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {removeImageError &&
        removeImageError.memoryId === memory._id && (
          <p className="memory-card-error">
            {removeImageError.message}
          </p>
        )}

      {isOwner && (
        <div className="memory-card-footer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleImagesSelected}
          />

          <button
            type="button"
            className="memory-card-add-images"
            onClick={handlePickImages}
            disabled={isUploading}
          >
            <ImagePlus size={15} />
            {isUploading
              ? "Uploading..."
              : "Add photos"}
          </button>

          {uploadError &&
            uploadError.memoryId === memory._id && (
              <span className="memory-card-error">
                <X size={13} />
                {uploadError.message}
              </span>
            )}
        </div>
      )}
    </article>
  );
}

export default memo(MemoryCard);
