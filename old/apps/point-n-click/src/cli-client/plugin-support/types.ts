import { GameModelManager } from "@point-n-click/engine";
import {
  FormattedText,
  GameState,
  GameStateManager,
  GameWorld,
  PatchFunction,
} from "@point-n-click/types";

export type PluginProps<Game extends GameWorld> = {
  gameModelManager: GameModelManager<Game>;
  state: GameStateManager<Game>;
  supplyPatch: (patch: PatchFunction<GameState<Game>>) => void;
  updateBorder: (newPrefix: FormattedText, newPostFix: FormattedText) => void;
  renderEmptyLine: () => Promise<void>;
  storeCustomInput: <T>(
    getInput: () => Promise<T>,
    displayPreviousInput: (value: T) => Promise<void>
  ) => Promise<T>;
  lightMode: boolean;
  prefix: FormattedText;
  postfix: FormattedText;
};
