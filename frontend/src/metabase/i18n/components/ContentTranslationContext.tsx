import { type ReactNode, createContext, useContext, useMemo } from "react";

import { useListContentTranslationsQuery } from "metabase/api/content-translation";
import { useLocale } from "metabase/common/hooks";

import type { ContentTranslationContextObject, TCFunc } from "../types";
import { translateContentString } from "../utils";

export const ContentTranslationContext =
  createContext<ContentTranslationContextObject>({
    dictionary: [],
    locale: "en",
  });

export const ContentTranslationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const locale = useLocale();

  const { data, error } = useListContentTranslationsQuery({
    locale,
  });

  if (error) {
    console.error("Error while retrieving content translations", error);
  }

  const contextValue = useMemo(
    () => ({
      dictionary: data?.data || [],
      locale,
    }),
    [data?.data, locale],
  );

  return (
    <ContentTranslationContext.Provider value={contextValue}>
      {children}
    </ContentTranslationContext.Provider>
  );
};

export const useTranslateContent = () => {
  const context = useContext(ContentTranslationContext);
  const contentTranslationFunction: TCFunc = useMemo(
    () =>
      <TypeOfMsgidArgument,>(msgid: TypeOfMsgidArgument) =>
        translateContentString(context, msgid),
    [context],
  );

  return contentTranslationFunction;
};
