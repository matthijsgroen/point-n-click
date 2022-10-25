import { GameModelManager } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import express from "express";
import { getContentFolder } from "@point-n-click/web-client";
import { join } from "path";
import { GameStateManager } from "@point-n-click/state";
import bodyParser from "body-parser";
import produce from "immer";

export const startWebserver = async (
  modelManager: GameModelManager<GameWorld>,
  stateManager: GameStateManager<GameWorld>,
  { port = 3456, lang }: { port?: number; lang?: string } = {}
) => {
  const app = express();
  const jsonParser = bodyParser.json();
  app.use(jsonParser);
  let serverStartResolver: () => void = () => {};
  const startupPromise = new Promise<void>((resolve) => {
    serverStartResolver = resolve;
  });

  app.get("/assets/contents.json", function (_req, res) {
    res.json(modelManager.getBackupModel());
  });

  app.get("/development-server/save.json", function (_req, res) {
    res.json(stateManager.getSaveState());
  });

  app.post("/development-server/action", function (req, res) {
    const actionId = req.body.action;
    stateManager.updateState(
      produce((state) => {
        state.currentInteraction = actionId;
      })
    );
    stateManager.updateSaveState();
    modelManager.restoreModel();

    res.json({ status: "ok" });
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
