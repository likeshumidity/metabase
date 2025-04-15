import { useMemo } from "react";

import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";
import type { ContentTranslationFunction } from "metabase/i18n/types";
import { translateContentString } from "metabase/i18n/utils";

export const useTranslateContent = (): ContentTranslationFunction => {
  const locale = useLocale();

  const { data: dictionaryMap } = useListContentTranslationsQuery({
    locale,
  });

  return useMemo(
    () =>
      <TypeOfMsgidArgument>(msgid: TypeOfMsgidArgument) =>
        translateContentString(dictionaryMap, msgid),
    [dictionaryMap],
  );
};
