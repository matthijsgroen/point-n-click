import { FormattedText } from "@point-n-click/engine";
import { ContentPluginContent } from "@point-n-click/types";

export const isDescriptionText = (
  item: ContentPluginContent
): item is ContentPluginContent & { text: FormattedText[] } =>
  item.pluginSource === "descriptionText" && item.type === "descriptionText";
