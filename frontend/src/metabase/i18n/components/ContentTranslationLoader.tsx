import { useEffect } from "react";

import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";
import { setContentTranslationLocale } from "metabase/i18n/reducers";
import { getContentTranslationDictionaryForCurrentLocale } from "metabase/i18n/selectors";
import { useDispatch, useSelector } from "metabase/lib/redux";

export const ContentTranslationLoader = () => {
  const dispatch = useDispatch();
  const locale = useLocale();
  const { locale: currentLocale } = useSelector(
    getContentTranslationDictionaryForCurrentLocale,
  );

  // Update locale in Redux when the application locale changes
  useEffect(() => {
    if (locale !== currentLocale) {
      dispatch(setContentTranslationLocale(locale));
    }
  }, [locale, currentLocale, dispatch]);

  // Fetch translations when locale changes
  const { error } = useListContentTranslationsQuery({
    locale,
  });

  if (error) {
    console.error("Error while retrieving content translations", error);
  }

  return null;
};
