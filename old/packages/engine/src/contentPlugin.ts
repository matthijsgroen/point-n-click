import {
  ContentStatement,
  ContentPluginStatement,
  ContentPlugin,
  DSLExtension,
  GameWorld,
  ContentPluginContent,
} from "@point-n-click/types";
import { DisplayInfo } from "./content/runScript";
import { getRegisteredThemes } from "./theme";

export const isContentPluginStatement = (
  statement: ContentStatement
): statement is ContentPluginStatement =>
  !!(statement as ContentPluginStatement).source;

export const isContentPluginContent = <Game extends GameWorld>(
  statement: DisplayInfo<Game>
): statement is ContentPluginContent =>
  !!(statement as ContentPluginContent).pluginSource;

export const getContentPlugin = (
  pluginType: string
): undefined | ContentPlugin<DSLExtension> => {
  /**
   * In the future we could extend this bit to return the highest version of a plugin type found.
   */
  for (const theme of getRegisteredThemes()) {
    const foundPlugin = theme.extensions.find(
      (plugin) => plugin.pluginType === pluginType
    );
    if (foundPlugin) {
      return foundPlugin;
    }
  }
  return undefined;
};
