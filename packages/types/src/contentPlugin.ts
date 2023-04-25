import { GameStateManager } from "./state";
import { GameWorld } from "./world";
import { Script, ScriptStatement } from "./ast";
import { GameModel } from "./model";
import { DisplayErrorText } from "./text";

export interface ContentStatement {
  statementType: string;
}

export interface ContentPluginStatement extends ContentStatement {
  source: string;
}

export type SystemInterface = {
  addPluginContent: <Item extends ContentStatement>(item: Item) => void;
  addBaseContent: (item: ScriptStatement<GameWorld>) => void;
  addScript: (execution: Script) => void;
};

/**
 * Description of functions to add.
 *
 * when using `character: (system: SystemInterface, character: string) =>
 * as signature, the result object will be merged with the other
 * character functions.
 */

export type DSLExtension<T extends string = string> = Record<
  T extends "character" ? never : string,
  (system: SystemInterface, ...args: any[]) => void
> & {
  character?: (
    system: SystemInterface
  ) => <Game extends GameWorld>(
    character: keyof Game["characters"]
  ) => Record<string, (...args: any[]) => void>;
};

export type TranslationFile = {
  [key: string]: string | TranslationFile;
};

export interface ContentPluginContent {
  type: string;
  pluginSource: string;
}

export type ContentPlugin<Extension extends DSLExtension> = {
  pluginType: string;
  dslFunctions: Extension;
  preloadContent?: (content: ContentStatement[]) => Promise<void>;
  unloadContent?: (content: ContentStatement[]) => Promise<void>;
  handleContent: <Game extends GameWorld>(
    content: ContentStatement,
    stateManager: GameStateManager<Game>,
    model: GameModel<Game>
  ) => (ContentPluginContent | DisplayErrorText)[];
  translationContent?: (content: ContentStatement[]) => TranslationFile;
};
