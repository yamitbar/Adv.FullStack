import { configureStore } from "@reduxjs/toolkit";
import tripsReducer from "./slices/tripsSlice";
import memoriesReducer from "./slices/memoriesSlice";

export const store = configureStore({
  reducer: {
    trips: tripsReducer,
    memories: memoriesReducer,
  },
});