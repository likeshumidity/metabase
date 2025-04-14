import { useMemo } from "react";

import { getContentTranslationDictionaryForCurrentLocale } from "metabase/i18n/selectors";
import { useSelector } from "metabase/lib/redux";

import type { TCFunc } from "./types";
import { translateContentString } from "./utils";

export const useTranslateContent = (): TCFunc => {
  const dictionaryForLocale = useSelector(
    getContentTranslationDictionaryForCurrentLocale,
  );

  const contentTranslationFunction: TCFunc = useMemo(
    () =>
      <TypeOfMsgidArgument>(msgid: TypeOfMsgidArgument) =>
        translateContentString(dictionaryForLocale, msgid),
    [dictionaryForLocale],
  );

  return contentTranslationFunction;
};
