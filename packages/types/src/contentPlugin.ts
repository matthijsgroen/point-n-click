import { GameStateManager } from "./state";
import { GameWorld } from "./world";

export interface ContentStatement {
  statementType: string;
}

export interface ContentPluginStatement extends ContentStatement {
  source: string;
}

export type SystemInterface = {
  addContent: <Item extends ContentStatement>(item: Item) => void;
};

export type DSLExtension = Record<
  string,
  (system: SystemInterface, ...args: any[]) => void
>;

export type TranslationFile = {
  [key: string]: string | TranslationFile;
};

export interface ContentPluginContent {
  type: string;
  pluginSource: string;
}

export type ContentPlugin<Extension extends DSLExtension> = {
  pluginType: string;
  preloadContent?: (content: ContentStatement[]) => Promise<void>;
  unloadContent?: (content: ContentStatement[]) => Promise<void>;
  handleContent: <Game extends GameWorld>(
    content: ContentStatement,
    stateManager: GameStateManager<Game>
  ) => ContentPluginContent[];
  translationContent?: (content: ContentStatement[]) => TranslationFile;
  dslFunctions: Extension;
};
