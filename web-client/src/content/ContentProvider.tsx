import { useQuery } from "@tanstack/react-query";
import React, {
  createContext,
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GameModel,
  GameState,
  createDefaultState,
  GameStateManager,
} from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";
import { gameModelManager, GameModelManager } from "@point-n-click/engine";

const defaultModel: GameModel<GameWorld> = {
  settings: {
    defaultLocale: "en-US",
    initialState: {},
    characterConfigs: {},
  },
  locations: [],
  overlays: [],
  themes: [],
};

const modelManager = gameModelManager(undefined);

const GameContentContext =
  createContext<GameModelManager<GameWorld>>(modelManager);

const GameStateContext = createContext<{
  stateRef: MutableRefObject<GameState<GameWorld> | undefined>;
  updateSavePointState: Dispatch<
    SetStateAction<GameState<GameWorld> | undefined>
  >;
  gameSavePointState: GameState<GameWorld> | undefined;
}>({
  stateRef: { current: createDefaultState(defaultModel) },
  gameSavePointState: createDefaultState(defaultModel),
  updateSavePointState: () => {},
});

export const useGameContent = (): GameModelManager<GameWorld> => {
  const [, rerender] = useState(0);
  const modelManager = useContext(GameContentContext);
  modelManager.waitForChange().then(() => {
    rerender((value) => (value + 1) % 10);
  });

  return modelManager;
};

export type UpdateGameState<World extends GameWorld> = Dispatch<
  SetStateAction<GameState<World>>
>;

export const useGameState = (): GameStateManager<GameWorld> => {
  const gameState = useContext(GameStateContext);

  return {
    getState: (): GameState<GameWorld> =>
      gameState.stateRef.current as GameState<GameWorld>,
    updateState: (action) => {
      if (typeof action === "function") {
        if (gameState.stateRef.current) {
          gameState.stateRef.current = action(gameState.stateRef.current);
        }
      } else {
        gameState.stateRef.current = action;
      }
    },
    getPlayState: () => "playing",
    setPlayState: () => {},
    isAborting: () => false,
    updateSaveState: () => {
      gameState.updateSavePointState(gameState.stateRef.current);
    },
    restoreSaveState: () => {
      gameState.stateRef.current = gameState.gameSavePointState;
    },
  };
};

export const ContentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isLoading, data } = useQuery(
    ["gameContent"],
    async (): Promise<GameModel<GameWorld>> => {
      const data = await fetch("/assets/contents.json");
      return data.json();
    }
  );

  const gameStateRef = useRef<GameState<GameWorld>>();

  const [gameSavePointState, setGameSavePointState] = useState<
    GameState<GameWorld> | undefined
  >(undefined);

  useEffect(() => {
    if (data && !gameStateRef.current) {
      const startState = createDefaultState(data);
      gameStateRef.current = startState;
      modelManager.setNewModel(data);
      setGameSavePointState(gameStateRef.current);
    } else {
      modelManager.setNewModel(data);
    }
  }, [data]);

  if (isLoading || !data || !gameStateRef.current) {
    return <div>Loading...</div>;
  }
  gameStateRef.current = gameSavePointState;

  return (
    <GameContentContext.Provider value={modelManager}>
      <GameStateContext.Provider
        value={{
          stateRef: gameStateRef,
          gameSavePointState,
          updateSavePointState: setGameSavePointState,
        }}
      >
        {children}
      </GameStateContext.Provider>
    </GameContentContext.Provider>
  );
};
