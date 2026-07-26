import { configureStore } from "@reduxjs/toolkit";
import tripsReducer from "./slices/tripsSlice";
import memoriesReducer from "./slices/memoriesSlice";

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
    memories: memoriesReducer,
  },

  // These actions carry a FormData/File in action.meta.arg, which is
  // never stored in state (only passed through to Axios) but would
  // otherwise trip Redux Toolkit's non-serializable-value warning.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "trips/createTrip/pending",
          "trips/createTrip/fulfilled",
          "trips/createTrip/rejected",
          "trips/updateTrip/pending",
          "trips/updateTrip/fulfilled",
          "trips/updateTrip/rejected",
          "trips/createLocation/pending",
          "trips/createLocation/fulfilled",
          "trips/createLocation/rejected",
        ],
      },
    }),
});