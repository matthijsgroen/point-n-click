import { gameModelManager } from "@point-n-click/engine";
import { mergeState } from "@point-n-click/state";
import { createGameSaveStateManager } from "../cli-client/gameStateManager";
import { runGame } from "../cli-client/run";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";
import { startWebserver } from "./webServer";
import { cls, resetStyling, setColor } from "../cli-client/utils";
import { hexColor } from "..";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { progressSpinner } from "./spinner";
import { resetDisplayType } from "../cli-client/displayType";

type ServerOptions = {
  lang: string;
  lightMode: boolean;
  port: number;
  resolver: (packageName: string) => string;
};

export const devServer = async (fileName: string, options: ServerOptions) => {
  const modelManager = gameModelManager(undefined);
  const unsubscribeContent = await startContentBuilder(
    fileName,
    options,
    modelManager
  );
  const translationData = await loadTranslationData(options.lang);

  const gameStateManager = await createGameSaveStateManager(modelManager);
  try {
    const saveFilePath = join(process.cwd(), ".autosave.json");
    const saveFile = await readFile(saveFilePath, { encoding: "utf-8" });
    const contents = JSON.parse(saveFile);
    gameStateManager
      .activeState()
      .update((state) => mergeState(state, contents));
    gameStateManager.updateSaveState();
  } catch (e) {}

  const [stopServer, runningPort] = await progressSpinner(
    "Creating initial build...",
    startWebserver(modelManager, gameStateManager, options)
  );

  process.stdout.on("resize", () => {
    modelManager.restoreModel();
  });

  const clearScreen = () => {
    cls();
    setColor(hexColor("ffff00"));
    console.log(
      `Server: http://localhost:${runningPort}. Use space to skip, q to quit. Lang: ${options.lang}`
    );
    resetStyling();
    console.log("");
    resetDisplayType();
  };

  // If model is not loaded yet, wait
  while (!modelManager.hasModel()) {
    await modelManager.waitForChange();
  }

  await runGame(
    { color: true, translationData, lightMode: options.lightMode },
    modelManager,
    gameStateManager,
    clearScreen
  );

  await unsubscribeContent();
  await stopServer();
  process.exit(0);
};
