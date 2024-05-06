import {
  GameWorld,
  GameModel,
  GameState,
  FormattedText,
  GameSaveStateManager,
  PatchFunction,
  DisplayErrorText,
} from "@point-n-click/types";
import {
  GameModelManager,
  formatParserError,
  formatStateError,
  getDisplayInfo,
  getInteractions,
  isParseError,
  isStateError,
} from "@point-n-click/engine";
import { handleInteractions } from "./handleInteractions";
import { renderDisplayInfo } from "./renderDisplayInfo";
import { renderText } from "./renderText";

export const runLocation = async <Game extends GameWorld>(
  gameModelManager: GameModelManager<Game>,
  stateManager: GameSaveStateManager<Game>,
  clearScreen: () => void,
  { lightMode }: { lightMode: boolean }
) => {
  const currentLocation = stateManager.activeState().get().currentLocation;

  const locationData = gameModelManager
    .getModel()
    .locations.find(
      (l: GameModel<Game>["locations"][number]) => l.id === currentLocation
    );

  if (!locationData) {
    return;
  }

  while (!stateManager.isAborting()) {
    const patches: Record<string, (state: GameState<Game>) => GameState<Game>> =
      {};

    let index = 0;
    let newPatch = false;
    const collectPatch = (patch: PatchFunction<GameState<Game>>) => {
      if (patches[index] !== undefined) return;
      newPatch = true;
      patches[index] = patch;
    };

    let displayInfo = getDisplayInfo(
      gameModelManager,
      stateManager.activeState()
    );

    if (stateManager.isAborting()) {
      return;
    }

    let prefix: FormattedText = [];
    let postfix: FormattedText = [];

    const updateBorder = (
      newPrefix: FormattedText,
      newPostfix: FormattedText
    ) => {
      prefix = newPrefix;
      postfix = newPostfix;
    };

    for (let i = 0; i < displayInfo.length; i++) {
      const item = displayInfo[i];

      await renderDisplayInfo(
        item,
        gameModelManager,
        stateManager,
        `key${index}`,
        collectPatch,
        updateBorder,
        {
          lightMode,
          prefix,
          postfix,
        }
      );

      if (newPatch) {
        newPatch = false;
        stateManager.restoreSaveState();
        displayInfo = getDisplayInfo(
          gameModelManager,
          stateManager.activeState(),
          patches
        );
      }

      index++;

      if (stateManager.isAborting()) {
        return;
      }
    }

    try {
      const interactions = getInteractions(
        gameModelManager,
        stateManager.activeState()
      );
      await handleInteractions(
        interactions,
        stateManager,
        gameModelManager,
        clearScreen
      );
    } catch (e) {
      let errorData: DisplayErrorText | null = null;
      if (isParseError(e)) {
        errorData = formatParserError(e);
      }
      if (isStateError(e)) {
        errorData = formatStateError(e);
      }
      if (errorData) {
        stateManager.setPlayState("reloading");
        gameModelManager.backupModel();

        for (const sentence of errorData.message) {
          await renderText(sentence, Infinity, {});
        }
      }
      break;
    }
  }
};
