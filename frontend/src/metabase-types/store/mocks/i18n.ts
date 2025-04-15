import type { I18nState } from "metabase-types/store";

export const createMockI18nState = (opts?: Partial<I18nState>): I18nState => ({
  contentTranslationDictionaryForCurrentLocale: {},
  ...opts,
});
