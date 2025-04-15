import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";

export const ContentTranslationLoader = () => {
  const locale = useLocale();
  useListContentTranslationsQuery({ locale });
  return null;
};
