import { PLUGIN_CONTENT_TRANSLATION } from "metabase/plugins";
import { hasPremiumFeature } from "metabase-enterprise/settings";

import { useTranslateContent } from "./hooks";

if (hasPremiumFeature("content_translation")) {
  Object.assign(PLUGIN_CONTENT_TRANSLATION, {
    isContentTranslationEnabled: true,
    useTranslateContent,
  });
}
