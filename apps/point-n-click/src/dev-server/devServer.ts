import { gameModelManager } from "@point-n-click/engine";
import { mergeState } from "@point-n-click/state";
import { createGameSaveStateManager } from "../cli-client/gameStateManager";
import { runGame } from "../cli-client/run";
import { startContentBuilder } from "../content-builder/contentBuilder";
import { loadTranslationData } from "../content-builder/loadTranslationData";
import { startWebserver } from "./webServer";
import { cls, resetStyling, setColor } from "../cli-client/utils";
import { hexColor } from "..";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { progressSpinner } from "../cli-utils/spinner";
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

  // If model is not loaded yet, wait
  while (!modelManager.hasModel()) {
    await modelManager.waitForChange();
  }

  const clearScreen = () => {
    cls();
    setColor(hexColor("ffff00"));

    const model = modelManager.getModel();
    const supportedLocales = Object.keys(
      model.settings.locales.supported
    ) as `${string}-${string}`[];
    const langId =
      supportedLocales.find((l) => l === options.lang) ??
      model.settings.locales.default;
    const languageName = model.settings.locales.supported[langId];

    console.log(
      `Server: http://localhost:${runningPort}. Use space to skip, q to quit. Lang: ${languageName}`
    );
    resetStyling();
    console.log("");
    resetDisplayType();
  };

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
