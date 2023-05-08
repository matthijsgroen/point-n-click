/// <reference types="node" />
import Parcel, { createWorkerFarm } from "@parcel/core";
import { MemoryFS, FileSystem } from "@parcel/fs";
import {
  clearRegisteredThemes,
  GameModelManager,
  registerTheme,
} from "@point-n-click/engine";
import { GameModel, GameWorld } from "@point-n-click/types";
import { join } from "path";
import {
  isLocale,
  exportTranslations,
} from "../export-translations/exportTranslations";
import { CACHE_FOLDER } from "../dev-server/constants";
import { displayTypescriptError } from "../dev-server/displayTypescriptError";
import { mkdir } from "./mkdir";
import { setTerminalTitle } from "../dev-server/terminalTitle";
import { watchTranslations } from "./watchTranslations";
import { convertToGameModel } from "./convertToGameModel";

type ServerOptions = {
  lang: string;
  resolver: (packageName: string) => string;
};

const createContentBundler = async (
  fileName: string,
  resolver: (packageName: string) => string
): Promise<{
  contentBundler: Parcel;
  readFile: (filePath: string) => Promise<string>;
  stopContentBundler: () => Promise<void>;
}> => {
  await mkdir(CACHE_FOLDER);
  const workerFarm = createWorkerFarm();
  const outputFS = new MemoryFS(workerFarm);
  const contentBundler = new Parcel({
    entries: fileName,
    defaultConfig: resolver("@parcel/config-default"),
    shouldAutoInstall: false,

    workerFarm,
    outputFS,
    defaultTargetOptions: {
      isLibrary: true,
      engines: { node: "*" },
    },
  });

  return {
    contentBundler,
    readFile: (filePath) => outputFS.readFile(filePath, "utf-8"),
    stopContentBundler: () => workerFarm.end(),
  };
};

export const startContentBuilder = async (
  fileName: string,
  { resolver, lang }: ServerOptions,
  modelManager: GameModelManager<GameWorld>
) => {
  let jsonModel: GameModel<GameWorld> | undefined = undefined;
  let translationWatchController: undefined | AbortController = undefined;

  let watchingTranslation: undefined | string = undefined;

  const { contentBundler, stopContentBundler, readFile } =
    await createContentBundler(fileName, resolver);

  let subscription = await contentBundler.watch(async (err, event) => {
    if (err) {
      console.log("Fatal error in build");
      // fatal error
      throw err;
    }

    if (event && event.type === "buildSuccess") {
      const bundles = event.bundleGraph.getBundles();
      let bundle = bundles[0];
      const gameContentsDSL = await readFile(bundle.filePath);
      try {
        jsonModel = await convertToGameModel(gameContentsDSL);
        if (jsonModel.themes) {
          clearRegisteredThemes();
          for (const themeRegistration of jsonModel.themes) {
            const resolvedPackage = resolver(themeRegistration.themePackage);
            await import(resolvedPackage).then((themeDefinition) => {
              registerTheme(
                themeDefinition.default.default(
                  themeRegistration.name,
                  themeRegistration.settings
                )
              );
            });
          }
        }

        const gameTitle = jsonModel.settings.gameTitle;
        setTerminalTitle(`${gameTitle} - dev`);

        const defaultLocale = jsonModel.settings.locales.default;
        if (isLocale(lang) && lang !== defaultLocale) {
          await exportTranslations(
            join(process.cwd(), "src", "translations"),
            resolver,
            [lang],
            jsonModel
          );

          if (!watchingTranslation) {
            translationWatchController = watchTranslations(lang, modelManager);
            watchingTranslation = lang;
          }
        }

        modelManager.setNewModel(jsonModel);
      } catch (e) {
        if (e instanceof TypeError || e instanceof ReferenceError) {
          const gameContentsSourceMap = await readFile(
            `${bundle.filePath}.map`
          );
          displayTypescriptError(gameContentsSourceMap, e);
          modelManager.setNewModel(undefined);
        } else {
          console.log("Fatal error in import");
          throw e;
        }
      }
    } else if (event && event.type === "buildFailure") {
      console.log(event.diagnostics);
      modelManager.setNewModel(undefined);
    }
  });
  return async () => {
    await subscription.unsubscribe();
    await stopContentBundler();
    if (translationWatchController) {
      (translationWatchController as AbortController).abort();
    }
  };
};

export const buildContent = async (
  fileName: string,
  {
    resolver,
  }: {
    resolver: (packageName: string) => string;
  }
): Promise<GameModel<GameWorld> | undefined> => {
  let jsonModel: GameModel<GameWorld> | undefined = undefined;
  const { contentBundler, stopContentBundler, readFile } =
    await createContentBundler(fileName, resolver);

  const event = await contentBundler.run();

  const bundles = event.bundleGraph.getBundles();
  const bundle = bundles[0];
  const gameContentsDSL = await readFile(bundle.filePath);

  try {
    jsonModel = await convertToGameModel(gameContentsDSL);
    return jsonModel;
  } catch (e) {
    if (e instanceof TypeError || e instanceof ReferenceError) {
      const gameContentsSourceMap = await readFile(`${bundle.filePath}.map`);
      displayTypescriptError(gameContentsSourceMap, e);
    }
  } finally {
    await stopContentBundler();
  }
};
