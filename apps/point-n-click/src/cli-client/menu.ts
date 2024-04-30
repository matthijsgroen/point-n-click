import {
  GameModelManager,
  Interpolator,
  applyState,
  getTranslationText,
  parseText,
} from "@point-n-click/engine";
import {
  GameSaveStateManager,
  GameState,
  GameWorld,
  hexColor,
} from "@point-n-click/types";
import { cls, keypress, setColor, stopSkip } from "./utils";
import { renderText } from "./renderText";
import { saveGame } from "./saveGame";
import { getSaveGames } from "./loadGame";
import { createDefaultState, mergeState } from "@point-n-click/state";

const MENU_CPM = 20_000;

const createPrinter = (state: Record<string, string>) => {
  const interpolator: Interpolator = (element) => {
    const value = state[element.value] ?? `"key [${element.value}] not found"`;
    return [{ text: value, type: "text" }];
  };

  return async (text: string | string[] = "") => {
    const texts: string[] = ([] as string[]).concat(text);
    for (const text of texts) {
      const parsedText = parseText(text);
      const interpolated = applyState(parsedText, interpolator);
      await renderText(interpolated, MENU_CPM, {});
    }
  };
};

export const menu = async <Game extends GameWorld>(
  modelManager: GameModelManager<Game>,
  stateManager: GameSaveStateManager<Game>,
  options: { port: number }
) => {
  const model = modelManager.getModel();
  const title = getTranslationText([], "title") ?? model.settings.gameTitle;
  const print = createPrinter({
    port: `${options.port}`,
    addr: `http://localhost:${options.port}`,
    title,
  });

  type MenuOption = {
    key: string;
    title: string;
    action: () => Promise<void> | void;
  };

  const showMenu = async (
    intro: string[],
    options: MenuOption[]
  ): Promise<MenuOption | null> => {
    cls();
    setColor(hexColor("ffff00"));
    await print(intro);
    for (const option of options) {
      await print(`${option.key}) ${option.title}`);
    }

    let chosenAction: string | undefined;
    stopSkip();
    do {
      const input = await Promise.race([
        keypress(),
        modelManager.waitForChange(),
      ]);
      if (typeof input === "boolean") {
        stateManager.setPlayState("reloading");
        return null;
      }
      const action = options.find((option) => option.key === input);

      if (action) {
        return action;
      }
    } while (!chosenAction);
    return null;
  };

  const option = await showMenu(
    [
      "** {b}Game paused{/b} **",
      "",

      "Server: [addr]",
      "Diagram: [addr]/diagram.html",
      "",
      "{b}[title] - Menu{/b}",
      "",
    ],
    [
      {
        key: "r",
        title: "Resume Game",
        action: () => {
          stateManager.setPlayState("playing");
        },
      },
      {
        key: "n",
        title: "Start New Game",
        action: () => {
          stateManager
            .activeState()
            .update(() => createDefaultState(modelManager.getModel()));
          stateManager.updateSaveState();
          stateManager.setPlayState("playing");
        },
      },
      {
        key: "l",
        title: "Load Game",
        action: async () => {
          const games = await getSaveGames();

          const options = Object.entries(games).map<MenuOption>(
            ([_fileSlot, saveGame], index) => {
              return {
                key: `${index + 1}`,
                title: saveGame.name,
                action: async () => {
                  stateManager
                    .activeState()
                    .update((state) =>
                      mergeState(state, saveGame.content as GameState<Game>)
                    );
                  stateManager.updateSaveState();
                  stateManager.setPlayState("playing");
                },
              };
            }
          );

          const loadOption = await showMenu(
            ["{b}[title] - Load Game{/b}", ""],
            options.concat([{ key: "c", title: "Cancel", action: () => {} }])
          );
          await loadOption?.action();
        },
      },
      {
        key: "s",
        title: "Save Game",
        action: async () => {
          const slots = await getSaveGames();

          const options = Array(10)
            .fill(0)
            .map<MenuOption>((_value, index) => {
              const save = slots[index + 1];

              return {
                key: `${index + 1}`,
                title: save ? save.name : "{i}<new save>{/i}",
                action: async () => {
                  await saveGame(
                    `Save ${index + 1}`,
                    `save${index + 1}`,
                    stateManager
                  );
                  stateManager.setPlayState("playing");
                },
              };
            });

          const saveOption = await showMenu(
            ["{b}[title] - Save Game{/b}", ""],
            options.concat([{ key: "c", title: "Cancel", action: () => {} }])
          );
          await saveOption?.action();
        },
      },
      {
        key: "q",
        title: "Quit Game",
        action: () => {
          stateManager.setPlayState("quitting");
        },
      },
    ]
  );
  await option?.action();
};
