import { GameModelManager } from "@point-n-click/engine";
import { GameWorld } from "@point-n-click/types";
import express from "express";
import { getContentFolder } from "@point-n-click/web-client";

export const startWebserver = async (
  modelManager: GameModelManager<GameWorld>,
  port: number = 3456
) => {
  const app = express();
  let serverStartResolver: () => void = () => {};
  const startupPromise = new Promise<void>((resolve) => {
    serverStartResolver = resolve;
  });

  app.get("/assets/contents.json", function (_req, res) {
    res.json(modelManager.getModel());
  });

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
