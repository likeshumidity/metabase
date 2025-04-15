import { useMemo } from "react";

import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";

import type { TCFunc } from "./types";
import { translateContentString } from "./utils";

export const useTranslateContent = (): TCFunc => {
  const locale = useLocale();
  const { data: dictionaryMap } = useListContentTranslationsQuery({
    locale,
  });

  const contentTranslationFunction: TCFunc = useMemo(
    () =>
      <TypeOfMsgidArgument>(msgid: TypeOfMsgidArgument) =>
        translateContentString(dictionaryMap, msgid),
    [dictionaryMap],
  );

  return contentTranslationFunction;
};
