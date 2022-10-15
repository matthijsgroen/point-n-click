import { emptyGameModel, GameModel } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";

export type GameModelManager<Game extends GameWorld> = {
  getModel: () => GameModel<Game>;
  hasModel: () => boolean;
  setNewModel: (model: GameModel<Game> | undefined) => void;
  waitForChange: () => Promise<boolean>;
  backupModel: () => void;
  restoreModel: () => void;
};

export const gameModelManager = <Game extends GameWorld>(
  initialModel: GameModel<Game> | undefined
): GameModelManager<Game> => {
  let internalModel = initialModel;
  let backupModel = initialModel;

  let resolver: (value: boolean) => void = () => {};
  let waitPromise = new Promise<boolean>((resolve) => {
    resolver = resolve;
  });

  const resetPromise = () => {
    waitPromise = new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  };

  return {
    getModel: () => internalModel ?? emptyGameModel(),
    hasModel: () => internalModel !== undefined,
    backupModel: () => {
      backupModel = internalModel;
      internalModel = undefined;
      resolver(false);
      resetPromise();
    },
    restoreModel: () => {
      internalModel = backupModel;
      resolver(internalModel !== undefined);
      resetPromise();
    },
    setNewModel: (model) => {
      internalModel = model;
      backupModel = internalModel;
      resolver(model !== undefined);
      resetPromise();
    },
    waitForChange: () => waitPromise,
  };
};
