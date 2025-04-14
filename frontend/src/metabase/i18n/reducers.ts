import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

import { contentTranslationApi } from "metabase/api/content-translation";
import type { ContentTranslationDictionary } from "metabase/i18n/types";

interface ContentTranslationsState {
  dictionary: ContentTranslationDictionary;
  locale: string;
  loading: boolean;
  error: string | null;
}

const initialState: ContentTranslationsState = {
  dictionary: [],
  locale: "en",
  loading: false,
  error: null,
};

export const contentTranslationsSlice = createSlice({
  name: "contentTranslations",
  initialState,
  reducers: {
    setContentTranslationLocale: (state, action: PayloadAction<string>) => {
      state.locale = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        contentTranslationApi.endpoints.listContentTranslations.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        },
      )
      .addMatcher(
        contentTranslationApi.endpoints.listContentTranslations.matchFulfilled,
        (state, action) => {
          state.loading = false;
          state.dictionary = action.payload.data || [];
        },
      )
      .addMatcher(
        contentTranslationApi.endpoints.listContentTranslations.matchRejected,
        (state, action) => {
          state.loading = false;
          state.error = action.error.message || "Failed to load translations";
        },
      );
  },
});

export const { setContentTranslationLocale } = contentTranslationsSlice.actions;

export const { reducer } = contentTranslationsSlice;
