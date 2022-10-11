import { runGame } from "../cli-client/run";
import { gameModelManager } from "../engine/model/gameModel";
import { startContentBuilder } from "./contentBuilder";
import { loadTranslationData } from "./loadTranslationData";

type ServerOptions = {
  lang: string;
};

export const devServer = async (fileName: string, options: ServerOptions) => {
  let modelManager = gameModelManager(undefined);
  const unsubscribe = await startContentBuilder(
    fileName,
    options,
    modelManager
  );

  // What should the entrypoint be? should it

  // let webBundler = new Parcel({
  //   entries: "",
  //   defaultConfig: "@parcel/config-default",
  //   workerFarm,
  //   outputFS,
  // });

  const translationData = await loadTranslationData(options.lang);

  await runGame({ color: true, translationData }, modelManager);
  await unsubscribe();
  process.exit(0);
};
