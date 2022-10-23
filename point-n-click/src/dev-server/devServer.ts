import { gameModelManager } from "@point-n-click/engine";
import { runGame } from "../cli-client/run";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";
import { startWebserver } from "./webServer";

type ServerOptions = {
  lang: string;
};

export const devServer = async (fileName: string, options: ServerOptions) => {
  let modelManager = gameModelManager(undefined);
  const unsubscribeContent = await startContentBuilder(
    fileName,
    options,
    modelManager
  );
  const stopServer = await startWebserver(modelManager);

  const translationData = await loadTranslationData(options.lang);

  await runGame({ color: true, translationData }, modelManager);

  await unsubscribeContent();
  stopServer();

  process.exit(0);
};
