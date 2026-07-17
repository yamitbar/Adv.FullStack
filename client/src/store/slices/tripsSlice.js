import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

const getErrorMessage = (
  error,
  fallbackMessage
) =>
  error.response?.data?.message ||
  error.message ||
  fallbackMessage;

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

    error: null,
    createError: null,
    detailsError: null,
    locationsError: null,
  },

  reducers: {
    clearTripsError: (state) => {
      state.error = null;
    },

    clearCreateTripError: (state) => {
      state.createError = null;
    },

    clearTripDetails: (state) => {
      state.selectedTrip = null;
      state.selectedTripLocations = [];
      state.detailsError = null;
      state.locationsError = null;
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
      );
  },
});

export const {
  clearTripsError,
  clearCreateTripError,
  clearTripDetails,
} = tripsSlice.actions;

export default tripsSlice.reducer;