import { PLUGIN_CONTENT_TRANSLATION } from "metabase/plugins";

// This is a placeholder component that just delegates to the plugin implementation
export const ContentTranslationLoader = () => {
  // We use the plugin version to allow enterprise edition to override this
  return <PLUGIN_CONTENT_TRANSLATION.ContentTranslationLoader />;
};
