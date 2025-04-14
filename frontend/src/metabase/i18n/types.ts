/** Mapping of raw strings (sometimes called 'msgids') to translations of these
 * strings (sometimes called 'msgstrs') This is a dictionary for a single
 * locale, so no locale information is stored in it */
export type DictionaryForLocale = Record<string, string>;

export type TCFunc = <TypeOfArgument>(
  msgid: TypeOfArgument,
) => string | TypeOfArgument;
