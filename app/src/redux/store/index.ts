import { combined_reducers } from "../reducers";
import { persistReducer } from "redux-persist";

import storage from "redux-persist/lib/storage";
import { configureStore } from "@reduxjs/toolkit";

const config = {
  key: "root",
  storage: storage,
};

const persisted = persistReducer(config, combined_reducers);

export const store = configureStore({
  reducer: persisted,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
