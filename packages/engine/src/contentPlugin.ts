import {
  ContentStatement,
  ContentPluginStatement,
  ContentPlugin,
  DSLExtension,
} from "@point-n-click/types";
import { getRegisteredThemes } from "./theme";

export const isContentPluginStatement = (
  statement: ContentStatement
): statement is ContentPluginStatement =>
  !!(statement as ContentPluginStatement).source;

export const getContentPlugin = (
  pluginType: string
): undefined | ContentPlugin<DSLExtension> => {
  /**
   * In the future we could extend this bit to return the highest version of a plugin type found.
   */
  for (const theme of getRegisteredThemes()) {
    const foundPlugin = theme.theme.extensions.find(
      (plugin) => plugin.pluginType === pluginType
    );
    if (foundPlugin) {
      return foundPlugin;
    }
  }
  return undefined;
};
