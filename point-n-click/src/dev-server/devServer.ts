import { runGame } from "../cli-client/run";
import { gameModelManager } from "../engine/model/gameModel";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";

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

  const translationData = await loadTranslationData(options.lang);

  await runGame({ color: true, translationData }, modelManager);
  await unsubscribeContent();
  process.exit(0);
};
