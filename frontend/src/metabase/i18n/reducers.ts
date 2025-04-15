import { createSlice } from "@reduxjs/toolkit";

import { contentTranslationApi } from "metabase/api/content-translation";
import type { I18nState } from "metabase-types/store/i18n";

const initialState: I18nState = {
  contentTranslationDictionaryForCurrentLocale: {},
};

export const contentTranslationsSlice = createSlice({
  name: "metabase-enterprise/content-translations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addMatcher(
      contentTranslationApi.endpoints.listContentTranslations.matchFulfilled,
      (state, action) => {
        // TODO: Need to transform the data here to just get the current locale?
        // Or change the BE endpoint so it only provides the active locale's dictionary
        state.contentTranslationDictionaryForCurrentLocale =
          action.payload.data || [];
      },
    );
  },
});

export const { reducer } = contentTranslationsSlice;
