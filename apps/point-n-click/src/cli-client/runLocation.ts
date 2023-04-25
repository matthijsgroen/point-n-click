import {
  GameWorld,
  GameStateManager,
  GameModel,
  GameState,
  FormattedText,
  GameSaveStateManager,
  PatchFunction,
} from "@point-n-click/types";
import {
  GameModelManager,
  getDisplayInfo,
  getInteractions,
} from "@point-n-click/engine";
import { handleInteractions } from "./handleInteractions";
import { renderDisplayInfo } from "./renderDisplayInfo";

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

      // TODO: If new patch registered?
      // Refetch displayInfo, supply patches.
      // continue rendering
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
  }
};
