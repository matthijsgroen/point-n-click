import { gameModelManager } from "@point-n-click/engine";
import { mergeState } from "@point-n-click/state";
import { createGameStateManager } from "../cli-client/gameStateManager";
import { runGame } from "../cli-client/run";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";
import { startWebserver } from "./webServer";
import { cls, resetStyling, setColor } from "../cli-client/utils";
import { hexColor } from "..";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type ServerOptions = {
  lang: string;
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

  const gameStateManager = await createGameStateManager(modelManager);
  try {
    const saveFilePath = join(process.cwd(), ".autosave.json");
    const saveFile = await readFile(saveFilePath, { encoding: "utf-8" });
    const contents = JSON.parse(saveFile);
    gameStateManager.updateState((state) => mergeState(state, contents));
    gameStateManager.updateSaveState();
  } catch (e) {}

  const [stopServer, runningPort] = await startWebserver(
    modelManager,
    gameStateManager,
    options
  );

  const clearScreen = () => {
    cls();
    setColor(hexColor("ffff00"));
    console.log(
      `Server running at: http://localhost:${runningPort}. Press space to skip, press q to quit. Lang: ${options.lang}`
    );
    resetStyling();
    console.log("");
  };

  await runGame(
    { color: true, translationData },
    modelManager,
    gameStateManager,
    clearScreen
  );

  await unsubscribeContent();
  await stopServer();
  process.exit(0);
};
