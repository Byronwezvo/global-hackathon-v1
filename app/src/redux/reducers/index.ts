import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth";

export const combined_reducers = combineReducers({
  auth: authReducer,
});
