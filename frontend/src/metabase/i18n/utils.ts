import type { ContentTranslationContextObject } from "./types";

/** Translate a user-generated string */
export const translateContentString = <TypeOfMsgidArgument>(
  context: ContentTranslationContextObject,
  /** We often need to pass in variables that have the type string|undefined,
   * so we allow variables of any type to be passed in, and they'll be
   * translated only if they're strings. */
  msgid: TypeOfMsgidArgument,
) => {
  if (typeof msgid !== "string") {
    return msgid;
  }

  if (!msgid.trim()) {
    return msgid;
  }

  const { dictionary = [], locale } = context;

  if (!dictionary.length) {
    return msgid;
  }

  const matches = dictionary.filter((entry) => {
    const { locale: entryLocaleCode, msgid: entryMsgid } = entry;
    return locale === entryLocaleCode && msgid === entryMsgid;
  });

  if (matches.length > 1) {
    console.error("Multiple matches for:", locale, msgid);
  }

  return matches[0]?.msgstr || msgid;
};
