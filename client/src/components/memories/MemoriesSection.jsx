import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  CircleAlert,
  Images,
  MessageSquareText,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

import MemoryCard from "./MemoryCard";

import {
  clearCreateMemoryError,
  clearMemories,
  createMemory,
  fetchMemories,
  uploadMemoryImages,
} from "../../store/slices/memoriesSlice";

import "./MemoriesSection.css";

const MAX_FILES = 5;

function MemoriesSection({ locationId }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(
    []
  );
  const [localError, setLocalError] = useState("");
  const [partialFailure, setPartialFailure] =
    useState("");

  const {
    items: memories,
    loading,
    error,
    creating,
    createError,
  } = useSelector((state) => state.memories);

  useEffect(() => {
    dispatch(fetchMemories(locationId));

    return () => {
      dispatch(clearMemories());
    };
  }, [dispatch, locationId]);

  const previewUrls = selectedFiles.map((file) =>
    URL.createObjectURL(file)
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  const handlePickFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setLocalError("");

    if (files.length > MAX_FILES) {
      setLocalError(
        `You can attach up to ${MAX_FILES} images at a time.`
      );
      return;
    }

    setSelectedFiles(files);
  };

  const handleRemoveSelectedFile = (index) => {
    setSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLocalError("");
    setPartialFailure("");
    dispatch(clearCreateMemoryError());

    if (!content.trim()) {
      setLocalError(
        "Write something about this place before saving."
      );
      return;
    }

    let createdMemory;

    try {
      createdMemory = await dispatch(
        createMemory({
          locationId,
          content: content.trim(),
        })
      ).unwrap();
    } catch {
      // Redux stores and displays the error message.
      return;
    }

    setContent("");

    if (selectedFiles.length > 0) {
      try {
        await dispatch(
          uploadMemoryImages({
            memoryId: createdMemory._id,
            files: selectedFiles,
          })
        ).unwrap();
      } catch (uploadFailure) {
        // The text memory was already created successfully - do not
        // report the whole operation as failed. The new MemoryCard's
        // own "Add photos" button lets the user retry the upload.
        setPartialFailure(
          uploadFailure?.message ||
            "The memory was saved, but the images failed to upload. Use \"Add photos\" on the new memory to try again."
        );
      }
    }

    setSelectedFiles([]);
  };

  return (
    <section className="memories-section">
      <div className="memories-section-heading">
        <span className="section-kicker">
          Shared memories
        </span>

        <h2>Memories</h2>
      </div>

      <form
        className="memory-create-form"
        onSubmit={handleSubmit}
      >
        <label className="memory-create-label">
          <MessageSquareText size={16} />
          Add a memory
        </label>

        <textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setLocalError("");
          }}
          placeholder="What happened here? Share the story..."
          rows={3}
          maxLength={2000}
        />

        {selectedFiles.length > 0 && (
          <div className="memory-create-previews">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="memory-create-preview"
              >
                <img
                  src={previewUrls[index]}
                  alt={`Selected upload ${index + 1}`}
                />

                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    handleRemoveSelectedFile(index)
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {(localError || createError) && (
          <div className="form-error">
            {localError || createError}
          </div>
        )}

        {partialFailure && (
          <div className="memory-create-partial-warning">
            {partialFailure}
          </div>
        )}

        <div className="memory-create-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleFilesSelected}
          />

          <button
            type="button"
            className="button button-secondary"
            onClick={handlePickFiles}
          >
            <Images size={17} />
            {selectedFiles.length > 0
              ? `${selectedFiles.length} image${
                  selectedFiles.length === 1 ? "" : "s"
                } selected`
              : "Add images"}
          </button>

          <button
            type="submit"
            className="button button-primary"
            disabled={creating || !content.trim()}
          >
            {creating ? "Saving..." : "Save memory"}
            {!creating && <Plus size={18} />}
          </button>
        </div>
      </form>

      {loading && (
        <div className="memories-loading-state">
          <div className="loader-spinner" />
          <span>Loading memories...</span>
        </div>
      )}

      {!loading && error && (
        <div className="memories-error-state">
          <CircleAlert size={22} />

          <div>
            <strong>Memories could not be loaded</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="button button-secondary"
            onClick={() =>
              dispatch(fetchMemories(locationId))
            }
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        memories.length === 0 && (
          <div className="memories-empty-state">
            <MessageSquareText size={28} />
            <h3>No memories here yet.</h3>
            <p>
              Be the first to add a story or a photo
              from this place.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        memories.length > 0 && (
          <div className="memories-list">
            {memories.map((memory) => (
              <MemoryCard
                key={memory._id}
                memory={memory}
              />
            ))}
          </div>
        )}
    </section>
  );
}

export default MemoriesSection;
