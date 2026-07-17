import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

import api from "../../services/api";

export const fetchTrips = createAsyncThunk(
  "trips/fetchTrips",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/trips");
      return data.trips;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message ||
          "Failed to load trips"
      );
    }
  }
);

const tripsSlice = createSlice({
  name: "trips",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearTripsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTripsError } = tripsSlice.actions;

export default tripsSlice.reducer;