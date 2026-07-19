import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

const getErrorMessage = (
  error,
  fallbackMessage
) => {
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

export const fetchTrips = createAsyncThunk(
  "trips/fetchTrips",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/trips");

      return data.trips;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to load trips"
        )
      );
    }
  }
);

export const fetchTripById = createAsyncThunk(
  "trips/fetchTripById",
  async (tripId, thunkAPI) => {
    try {
      const { data } = await api.get(
        `/trips/${tripId}`
      );

      return data.trip;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to load the trip"
        )
      );
    }
  }
);

export const fetchTripLocations =
  createAsyncThunk(
    "trips/fetchTripLocations",
    async (tripId, thunkAPI) => {
      try {
        const { data } = await api.get(
          `/trips/${tripId}/locations`
        );

        return data.locations;
      } catch (error) {
        return thunkAPI.rejectWithValue(
          getErrorMessage(
            error,
            "Failed to load trip locations"
          )
        );
      }
    }
  );

export const createTrip = createAsyncThunk(
  "trips/createTrip",
  async (tripData, thunkAPI) => {
    try {
      const { data } = await api.post(
        "/trips",
        tripData
      );

      return data.trip;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to create trip"
        )
      );
    }
  }
);

export const updateTrip = createAsyncThunk(
  "trips/updateTrip",
  async ({ tripId, tripData }, thunkAPI) => {
    try {
      const { data } = await api.put(
        `/trips/${tripId}`,
        tripData
      );

      return data.trip;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to update trip"
        )
      );
    }
  }
);

export const deleteTrip = createAsyncThunk(
  "trips/deleteTrip",
  async (tripId, thunkAPI) => {
    try {
      await api.delete(`/trips/${tripId}`);

      return tripId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to delete trip"
        )
      );
    }
  }
);

export const joinTrip = createAsyncThunk(
  "trips/joinTrip",
  async (inviteCode, thunkAPI) => {
    try {
      const { data } = await api.post(
        "/trips/join",
        { inviteCode }
      );

      return data.trip;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        getErrorMessage(
          error,
          "Failed to join trip"
        )
      );
    }
  }
);

export const createLocation =
  createAsyncThunk(
    "trips/createLocation",
    async (
      { tripId, locationData },
      thunkAPI
    ) => {
      try {
        const { data } = await api.post(
          `/trips/${tripId}/locations`,
          locationData
        );

        return data.location;
      } catch (error) {
        return thunkAPI.rejectWithValue(
          getErrorMessage(
            error,
            "Failed to create location"
          )
        );
      }
    }
  );

const tripsSlice = createSlice({
  name: "trips",

  initialState: {
    items: [],

    selectedTrip: null,
    selectedTripLocations: [],

    loading: false,
    creating: false,
    detailsLoading: false,
    locationsLoading: false,
    creatingLocation: false,
    updatingTrip: false,
    deletingTrip: false,
    joiningTrip: false,

    error: null,
    createError: null,
    detailsError: null,
    locationsError: null,
    createLocationError: null,
    updateTripError: null,
    deleteTripError: null,
    joinTripError: null,
  },

  reducers: {
    clearTripsError: (state) => {
      state.error = null;
    },

    clearCreateTripError: (state) => {
      state.createError = null;
    },

    clearCreateLocationError: (state) => {
      state.createLocationError = null;
    },

    clearUpdateTripError: (state) => {
      state.updateTripError = null;
    },

    clearDeleteTripError: (state) => {
      state.deleteTripError = null;
    },

    clearJoinTripError: (state) => {
      state.joinTripError = null;
    },

    clearTripDetails: (state) => {
      state.selectedTrip = null;
      state.selectedTripLocations = [];
      state.detailsError = null;
      state.locationsError = null;
      state.createLocationError = null;
      state.updateTripError = null;
      state.deleteTripError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchTrips.fulfilled,
        (state, action) => {
          state.loading = false;
          state.items = action.payload;
        }
      )

      .addCase(
        fetchTrips.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )

      .addCase(
        fetchTripById.pending,
        (state) => {
          state.detailsLoading = true;
          state.detailsError = null;
        }
      )

      .addCase(
        fetchTripById.fulfilled,
        (state, action) => {
          state.detailsLoading = false;
          state.selectedTrip = action.payload;
        }
      )

      .addCase(
        fetchTripById.rejected,
        (state, action) => {
          state.detailsLoading = false;
          state.detailsError = action.payload;
        }
      )

      .addCase(
        fetchTripLocations.pending,
        (state) => {
          state.locationsLoading = true;
          state.locationsError = null;
        }
      )

      .addCase(
        fetchTripLocations.fulfilled,
        (state, action) => {
          state.locationsLoading = false;
          state.selectedTripLocations =
            action.payload;
        }
      )

      .addCase(
        fetchTripLocations.rejected,
        (state, action) => {
          state.locationsLoading = false;
          state.locationsError = action.payload;
        }
      )

      .addCase(createTrip.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })

      .addCase(
        createTrip.fulfilled,
        (state, action) => {
          state.creating = false;
          state.items.unshift(action.payload);
        }
      )

      .addCase(
        createTrip.rejected,
        (state, action) => {
          state.creating = false;
          state.createError = action.payload;
        }
      )

      .addCase(updateTrip.pending, (state) => {
        state.updatingTrip = true;
        state.updateTripError = null;
      })

      .addCase(
        updateTrip.fulfilled,
        (state, action) => {
          state.updatingTrip = false;
          state.selectedTrip = action.payload;

          const index = state.items.findIndex(
            (trip) =>
              trip._id === action.payload._id
          );

          if (index !== -1) {
            state.items[index] = action.payload;
          }
        }
      )

      .addCase(
        updateTrip.rejected,
        (state, action) => {
          state.updatingTrip = false;
          state.updateTripError = action.payload;
        }
      )

      .addCase(deleteTrip.pending, (state) => {
        state.deletingTrip = true;
        state.deleteTripError = null;
      })

      .addCase(
        deleteTrip.fulfilled,
        (state, action) => {
          state.deletingTrip = false;
          state.items = state.items.filter(
            (trip) => trip._id !== action.payload
          );
        }
      )

      .addCase(
        deleteTrip.rejected,
        (state, action) => {
          state.deletingTrip = false;
          state.deleteTripError = action.payload;
        }
      )

      .addCase(joinTrip.pending, (state) => {
        state.joiningTrip = true;
        state.joinTripError = null;
      })

      .addCase(
        joinTrip.fulfilled,
        (state, action) => {
          state.joiningTrip = false;

          const alreadyPresent = state.items.some(
            (trip) =>
              trip._id === action.payload._id
          );

          if (!alreadyPresent) {
            state.items.unshift(action.payload);
          }
        }
      )

      .addCase(
        joinTrip.rejected,
        (state, action) => {
          state.joiningTrip = false;
          state.joinTripError = action.payload;
        }
      )

      .addCase(
        createLocation.pending,
        (state) => {
          state.creatingLocation = true;
          state.createLocationError = null;
        }
      )

      .addCase(
        createLocation.fulfilled,
        (state, action) => {
          state.creatingLocation = false;
          state.selectedTripLocations.unshift(
            action.payload
          );
        }
      )

      .addCase(
        createLocation.rejected,
        (state, action) => {
          state.creatingLocation = false;
          state.createLocationError =
            action.payload;
        }
      );
  },
});

export const {
  clearTripsError,
  clearCreateTripError,
  clearCreateLocationError,
  clearUpdateTripError,
  clearDeleteTripError,
  clearJoinTripError,
  clearTripDetails,
} = tripsSlice.actions;

export default tripsSlice.reducer;