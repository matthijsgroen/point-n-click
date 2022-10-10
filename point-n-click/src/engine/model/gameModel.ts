import { GameModel, Settings } from "../../dsl/ast-types";
import { GameWorld } from "../../dsl/world-types";

export type GameModelManager<Game extends GameWorld> = {
  getModel: () => GameModel<Game>;
  hasModel: () => boolean;
  setNewModel: (model: GameModel<Game> | undefined) => void;
  waitForChange: () => Promise<boolean>;
  backupModel: () => void;
  restoreModel: () => void;
};

const emptyGameModel = <Game extends GameWorld>(): GameModel<Game> => ({
  settings: {
    defaultLocale: "en-US",
    initialState: {},
    characterConfigs: {} as Settings<Game>["characterConfigs"],
  },
  locations: [],
  overlays: [],
});

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
