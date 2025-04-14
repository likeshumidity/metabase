import type { State } from "metabase-types/store";

export const getContentTranslationDictionaryForCurrentLocale = (state: State) =>
  state.i18n.contentTranslationDictionaryForCurrentLocale;
