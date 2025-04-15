import { PLUGIN_CONTENT_TRANSLATION } from "metabase/plugins";
import type { TCFunc } from "./types";

// To keep the components that invoke the plugin hook tidier, they can invoke
// this facade, which delegates to the plugin implementation
export const useTranslateContent = (): TCFunc => {
  return PLUGIN_CONTENT_TRANSLATION.useTranslateContent();
};
