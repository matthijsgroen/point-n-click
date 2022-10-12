import { runGame } from "../cli-client/run";
import { gameModelManager } from "../engine/model/gameModel";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";
import { startWebServer } from "./webserver";

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

  const unsubscribeWeb = await startWebServer(modelManager);

  const translationData = await loadTranslationData(options.lang);

  await runGame({ color: true, translationData }, modelManager);
  await unsubscribeContent();
  await unsubscribeWeb();
  process.exit(0);
};
