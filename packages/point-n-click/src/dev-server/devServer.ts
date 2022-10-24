import { gameModelManager } from "@point-n-click/engine";
import { createGameStateManager } from "../cli-client/gameStateManager";
import { runGame } from "../cli-client/run";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";
import { startWebserver } from "./webServer";

type ServerOptions = {
  lang: string;
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
  const stopServer = await startWebserver(modelManager, gameStateManager, {
    lang: options.lang,
  });

  await runGame(
    { color: true, translationData },
    modelManager,
    gameStateManager
  );

  await unsubscribeContent();
  stopServer();

  process.exit(0);
};
