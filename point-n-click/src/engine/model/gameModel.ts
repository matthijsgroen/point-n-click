import { GameModel } from "../../dsl/ast-types";
import { GameWorld } from "../../dsl/world-types";

export type GameModelManager<Game extends GameWorld> = {
  getModel: () => GameModel<Game>;
  setNewModel: (model: GameModel<Game>) => void;
  waitForChange: () => Promise<void>;
};

export const gameModelManager = <Game extends GameWorld>(
  initialModel: GameModel<Game>
): GameModelManager<Game> => {
  let internalModel = initialModel;

  let resolver: () => void = () => {};
  let waitPromise = new Promise<void>((resolve) => {
    resolver = resolve;
  });

  const resetPromise = () => {
    waitPromise = new Promise<void>((resolve) => {
      resolver = resolve;
    });
  };

  return {
    getModel: () => internalModel,
    setNewModel: (model) => {
      internalModel = model;
      resolver();
      resetPromise();
    },
    waitForChange: () => waitPromise,
  };
};
