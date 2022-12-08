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
  createDefaultState,
  emptyGameModel,
} from "@point-n-click/state";
import {
  GameState,
  GameStateManager,
  GameWorld,
  TranslationFile,
} from "@point-n-click/types";
import {
  gameModelManager,
  GameModelManager,
  updateTranslation,
} from "@point-n-click/engine";
import { getClientSettings, setClientSettings } from "../settings";
import styles from "./ContentProvider.module.css";

const defaultModel = emptyGameModel();

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

const REFETCH_INTERVAL = 3000;

export const ContentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isLoading, data } = useQuery(
    ["gameContent"],
    async (): Promise<GameModel<GameWorld>> => {
      const data = await fetch("/assets/contents.json");
      return data.json();
    },
    developmentMode
      ? {
          refetchInterval: REFETCH_INTERVAL,
          refetchIntervalInBackground: true,
        }
      : {}
  );

  const { data: languageData } = useQuery(
    ["languageContent"],
    async (): Promise<TranslationFile | undefined> => {
      if (!data) {
        return undefined;
      }
      const currentLocale = getClientSettings().currentLocale;
      if (currentLocale !== data.settings.locales.default) {
        const data = await fetch(`/assets/lang/${currentLocale}.json`);
        return data.json();
      }
      return undefined;
    },
    developmentMode
      ? {
          refetchInterval: REFETCH_INTERVAL,
          refetchIntervalInBackground: true,
          enabled: !!data,
        }
      : { enabled: !!data }
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
      },
      {
        refetchInterval: REFETCH_INTERVAL,
        refetchIntervalInBackground: true,
      }
    );
    if (saveData !== gameSavePointState) {
      gameStateRef.current = saveData;
      modelManager.setNewModel(data);
      setGameSavePointState(saveData);
    }
  } else {
    if (data && !gameSavePointState) {
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
    updateTranslation({ translationData: languageData });
    if (gameStateRef.current) {
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
