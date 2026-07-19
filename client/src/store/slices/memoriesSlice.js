import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

// Memories are domain data with several independent async operations
// (fetch, create, upload images, edit, delete) that only ever live on
// the Location Details page today, but follow the same Redux Toolkit
// pattern already used for trips - kept in its own slice instead of
// growing tripsSlice, since memories are conceptually a different
// resource with their own loading/error states.

const getErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (
    Array.isArray(responseData?.errors) &&
    responseData.errors.length > 0
  ) {
    return responseData.errors.join(", ");
  }

  return (
    responseData?.message ||
    error?.message ||
    fallbackMessage
  );
};

export const fetchMemories = createAsyncThunk(
  "memories/fetchMemories",
  async (locationId, thunkAPI) => {
    try {
      const { data } = await api.get(
        `/locations/${locationId}/memories`
      );

      return data.memories;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to load memories"
        )
      );
    }
  }
);

export const createMemory = createAsyncThunk(
  "memories/createMemory",
  async ({ locationId, content }, thunkAPI) => {
    try {
      const { data } = await api.post(
        `/locations/${locationId}/memories`,
        { content }
      );

      return data.memory;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to create memory"
        )
      );
    }
  }
);

export const uploadMemoryImages = createAsyncThunk(
  "memories/uploadMemoryImages",
  async ({ memoryId, files }, thunkAPI) => {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const { data } = await api.post(
        `/memories/${memoryId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return data.memory;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        memoryId,
        message: getErrorMessage(
          error,
          "Failed to upload images"
        ),
      });
    }
  }
);

export const updateMemory = createAsyncThunk(
  "memories/updateMemory",
  async ({ memoryId, content }, thunkAPI) => {
    try {
      const { data } = await api.put(
        `/memories/${memoryId}`,
        { content }
      );

      return data.memory;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        memoryId,
        message: getErrorMessage(
          error,
          "Failed to update memory"
        ),
      });
    }
  }
);

export const deleteMemory = createAsyncThunk(
  "memories/deleteMemory",
  async (memoryId, thunkAPI) => {
    try {
      await api.delete(`/memories/${memoryId}`);

      return memoryId;
    } catch (error) {
      return thunkAPI.rejectWithValue({
        memoryId,
        message: getErrorMessage(
          error,
          "Failed to delete memory"
        ),
      });
    }
  }
);

const memoriesSlice = createSlice({
  name: "memories",

  initialState: {
    items: [],

    loading: false,
    error: null,

    creating: false,
    createError: null,

    uploadingMemoryId: null,
    uploadError: null,

    updatingMemoryId: null,
    updateError: null,

    deletingMemoryId: null,
    deleteError: null,
  },

  reducers: {
    clearMemories: (state) => {
      state.items = [];
      state.error = null;
      state.createError = null;
      state.uploadError = null;
      state.updateError = null;
      state.deleteError = null;
    },

    clearCreateMemoryError: (state) => {
      state.createError = null;
    },

    clearUploadMemoryError: (state) => {
      state.uploadError = null;
    },

    clearUpdateMemoryError: (state) => {
      state.updateError = null;
    },

    clearDeleteMemoryError: (state) => {
      state.deleteError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchMemories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchMemories.fulfilled,
        (state, action) => {
          state.loading = false;
          state.items = action.payload;
        }
      )

      .addCase(
        fetchMemories.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      .addCase(createMemory.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })

      .addCase(
        createMemory.fulfilled,
        (state, action) => {
          state.creating = false;
          state.items.unshift(action.payload);
        }
      )

      .addCase(
        createMemory.rejected,
        (state, action) => {
          state.creating = false;
          state.createError = action.payload;
        }
      )

      .addCase(
        uploadMemoryImages.pending,
        (state, action) => {
          state.uploadingMemoryId =
            action.meta.arg.memoryId;
          state.uploadError = null;
        }
      )

      .addCase(
        uploadMemoryImages.fulfilled,
        (state, action) => {
          state.uploadingMemoryId = null;

          const index = state.items.findIndex(
            (memory) =>
              memory._id === action.payload._id
          );

          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      )

      .addCase(
        uploadMemoryImages.rejected,
        (state, action) => {
          state.uploadingMemoryId = null;
          state.uploadError = action.payload;
        }
      )

      .addCase(updateMemory.pending, (state, action) => {
        state.updatingMemoryId =
          action.meta.arg.memoryId;
        state.updateError = null;
      })

      .addCase(
        updateMemory.fulfilled,
        (state, action) => {
          state.updatingMemoryId = null;

          const index = state.items.findIndex(
            (memory) =>
              memory._id === action.payload._id
          );

          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      )

      .addCase(
        updateMemory.rejected,
        (state, action) => {
          state.updatingMemoryId = null;
          state.updateError = action.payload;
        }
      )

      .addCase(deleteMemory.pending, (state, action) => {
        state.deletingMemoryId = action.meta.arg;
        state.deleteError = null;
      })

      .addCase(
        deleteMemory.fulfilled,
        (state, action) => {
          state.deletingMemoryId = null;
          state.items = state.items.filter(
            (memory) => memory._id !== action.payload
          );
        }
      )

      .addCase(
        deleteMemory.rejected,
        (state, action) => {
          state.deletingMemoryId = null;
          state.deleteError = action.payload;
        }
      );
  },
});

export const {
  clearMemories,
  clearCreateMemoryError,
  clearUploadMemoryError,
  clearUpdateMemoryError,
  clearDeleteMemoryError,
} = memoriesSlice.actions;

export default memoriesSlice.reducer;
