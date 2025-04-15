import { PLUGIN_CONTENT_TRANSLATION } from "metabase/plugins";
import { ContentTranslationLoader } from "./components/ContentTranslationLoader";
import { useTranslateContent } from "./hooks";

import { hasPremiumFeature } from "metabase-enterprise/settings";

if (
  // TODO Remove this once the Cloud team adds the token feature
  true ||
  hasPremiumFeature("content_translation")
) {
  Object.assign(PLUGIN_CONTENT_TRANSLATION, {
    isContentTranslationEnabled: true,
    ContentTranslationLoader,
    useTranslateContent,
  });
}
