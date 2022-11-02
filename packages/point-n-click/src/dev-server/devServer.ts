import { gameModelManager } from "@point-n-click/engine";
import { createGameStateManager } from "../cli-client/gameStateManager";
import { runGame } from "../cli-client/run";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";
import { startWebserver } from "./webServer";

type ServerOptions = {
  lang: string;
};

export const devServer = async (
  fileName: string,
  resolves: Record<string, string>,
  options: ServerOptions
) => {
  const modelManager = gameModelManager(undefined);
  // Check if filename exists...

  const unsubscribeContent = await startContentBuilder(
    fileName,
    resolves,
    options,
    modelManager
  );
  const translationData = await loadTranslationData(options.lang);

  const gameStateManager = await createGameStateManager(modelManager);
  const stopServer = await startWebserver(
    modelManager,
    gameStateManager,
    resolves,
    {
      lang: options.lang,
    }
  );

  await runGame(
    { color: true, translationData },
    modelManager,
    gameStateManager
  );

  await unsubscribeContent();
  await stopServer();
  process.exit(0);
};
