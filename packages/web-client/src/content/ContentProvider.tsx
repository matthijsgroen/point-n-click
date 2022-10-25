import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  gameModelManager,
  GameModelManager,
  updateTranslation,
  TranslationFile,
} from "@point-n-click/engine";
import { setClientSettings } from "../settings";
import styles from "./ContentProvider.module.css";

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
  setInteraction: Dispatch<string>;
  gameSavePointState: GameState<GameWorld> | undefined;
}>({
  stateRef: { current: createDefaultState(defaultModel) },
  gameSavePointState: createDefaultState(defaultModel),
  setInteraction: () => {},
});

export const useGameContent = (): GameModelManager<GameWorld> =>
  useContext(GameContentContext);

export type UpdateGameState<World extends GameWorld> = Dispatch<
  SetStateAction<GameState<World>>
>;

export const useGameState = (): GameStateManager<GameWorld> & {
  setInteraction: Dispatch<string>;
} => {
  const gameState = useContext(GameStateContext);

  return {
    getState: (): GameState<GameWorld> =>
      gameState.stateRef.current as GameState<GameWorld>,
    getSaveState: () => gameState.gameSavePointState as GameState<GameWorld>,
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
    updateSaveState: () => {},
    restoreSaveState: () => {
      gameState.stateRef.current = gameState.gameSavePointState;
    },
    setInteraction: (action) => {
      gameState.setInteraction(action);
    },
  };
};

const developmentMode =
  document.body.attributes.getNamedItem("data-environment")?.value ===
  "development";

export const ContentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isLoading, data } = useQuery(
    ["gameContent"],
    async (): Promise<GameModel<GameWorld>> => {
      const data = await fetch("/assets/contents.json");
      return data.json();
    }
  );
  const { data: languageData } = useQuery(
    ["languageContent"],
    async (): Promise<TranslationFile> => {
      const data = await fetch("/assets/lang/nl-NL.json");
      return data.json();
    }
  );

  const [, rerender] = useState(0);
  const queryClient = useQueryClient();
  const [gameSavePointState, setGameSavePointState] = useState<
    GameState<GameWorld> | undefined
  >(undefined);
  const gameStateRef = useRef<GameState<GameWorld>>();

  if (developmentMode) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: saveData } = useQuery(
      ["saveData"],
      async (): Promise<GameState<GameWorld>> => {
        const data = await fetch("/development-server/save.json");
        return data.json();
      }
    );
    if (saveData !== gameSavePointState) {
      gameStateRef.current = saveData;
      modelManager.setNewModel(data);
      setGameSavePointState(saveData);
    }
  } else {
    if (data && !gameSavePointState) {
      console.log("set start state");
      const startState = createDefaultState(data);
      gameStateRef.current = startState;
      modelManager.setNewModel(data);
      setGameSavePointState(startState);
    }
  }

  const setInteraction: Dispatch<string> = developmentMode
    ? async (action) => {
        await fetch("/development-server/action", {
          method: "POST",
          headers: { "Content-type": "application/json;charset=UTF-8" },
          body: JSON.stringify({ action }),
        });
        setClientSettings({ skipMode: false });
        queryClient.invalidateQueries(["saveData"]);
      }
    : (action) => {
        setClientSettings({ skipMode: false });
        setGameSavePointState((state) =>
          state
            ? {
                ...state,
                ...gameStateRef.current,
                currentInteraction: action,
              }
            : undefined
        );
      };

  gameStateRef.current = gameSavePointState;

  useEffect(() => {
    if (gameStateRef.current) {
      updateTranslation({ translationData: languageData });
      setClientSettings({ skipMode: true });
      modelManager.setNewModel(data);
      rerender((s) => (s + 1) % 100);
    }
  }, [data, languageData]);

  if (isLoading || !data || !gameStateRef.current) {
    return (
      <div className={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <GameContentContext.Provider value={modelManager}>
      <GameStateContext.Provider
        value={{
          stateRef: gameStateRef,
          gameSavePointState,
          setInteraction,
        }}
      >
        {children}
      </GameStateContext.Provider>
    </GameContentContext.Provider>
  );
};
