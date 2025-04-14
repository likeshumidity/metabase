import type { DictionaryForLocale } from "./types";

/** Translate a user-generated string */
export const translateContentString = <TypeOfMsgidArgument>(
  dictionary: DictionaryForLocale,
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

  if (!dictionary.length) {
    return msgid;
  }

  return dictionary[msgid] || msgid;
};
