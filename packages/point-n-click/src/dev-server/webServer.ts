import { GameModelManager, getTranslation } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import express from "express";
import { getContentFolder } from "@point-n-click/web-client";
import { join } from "path";

export const startWebserver = async (
  modelManager: GameModelManager<GameWorld>,
  { port = 3456, lang }: { port?: number; lang?: string } = {}
) => {
  const app = express();
  let serverStartResolver: () => void = () => {};
  const startupPromise = new Promise<void>((resolve) => {
    serverStartResolver = resolve;
  });

  app.get("/assets/contents.json", function (_req, res) {
    res.json(modelManager.getModel());
  });

  const translationFilePath = join(process.cwd(), "src", "translations");
  app.use("/assets/lang/", express.static(translationFilePath));

  app.use(express.static(getContentFolder()));

  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    serverStartResolver();
  });

  await startupPromise;

  return () => {
    server.close();
  };
};
