import { useMemo } from "react";

import { translateContentString } from "metabase/i18n/utils";
import type { TCFunc } from "metabase/i18n/types";

import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";

export const useTranslateContent = (): TCFunc => {
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
