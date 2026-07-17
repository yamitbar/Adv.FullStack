import { configureStore } from "@reduxjs/toolkit";
import tripsReducer from "./slices/tripsSlice";

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
  },
});