import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";

// TODO: This isn't needed, let's remove it
export const ContentTranslationLoader = () => {
  const locale = useLocale();
  useListContentTranslationsQuery({ locale });
  return null;
};
