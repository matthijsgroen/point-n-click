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
  Locale,
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
import {
  getClientSettings,
  setClientSettings,
  subscribeClientSettings,
} from "../settings";
import styles from "./ContentProvider.module.css";
import { useSetAtom } from "jotai";
import { gameContentAtom } from "./gameContent";

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

export const useGameLocale = (): {
  locale: Locale;
  supportedLocales: GameModel<GameWorld>["settings"]["locales"]["supported"];
  setLocale: (newLocale: Locale) => void;
} => {
  const modelManager = useGameContent();

  return {
    locale: getClientSettings().currentLocale,
    supportedLocales: modelManager.getModel().settings.locales.supported,
    setLocale: (newLocale) => {
      setClientSettings({ currentLocale: newLocale });
    },
  };
};

const developmentMode =
  document.body.attributes.getNamedItem("data-environment")?.value ===
  "development";

const REFETCH_INTERVAL = 3000;

const USE_DEFAULT_LANGUAGE = "DEFAULT_LANG" as const;

export const ContentProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isInitialLoading, data: gameContent } = useQuery(
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
  const setGameContent = useSetAtom(gameContentAtom);
  if (gameContent) {
    setGameContent(gameContent);
  }

  const { data: languageData } = useQuery(
    ["languageContent"],
    async (): Promise<
      TranslationFile | typeof USE_DEFAULT_LANGUAGE | undefined
    > => {
      if (!gameContent) {
        return undefined;
      }
      const currentLocale = getClientSettings().currentLocale;
      if (currentLocale !== gameContent.settings.locales.default) {
        const data = await fetch(`/assets/lang/${currentLocale}.json`);
        return data.json();
      }
      return USE_DEFAULT_LANGUAGE;
    },
    developmentMode
      ? {
          refetchInterval: REFETCH_INTERVAL,
          refetchIntervalInBackground: true,
          enabled: !!gameContent,
        }
      : { enabled: !!gameContent }
  );

  // const [, rerender] = useState(0);
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
      modelManager.setNewModel(gameContent);
      setGameSavePointState(saveData);
    }
  } else {
    if (gameContent && !gameSavePointState) {
      const startState = createDefaultState(gameContent);
      gameStateRef.current = startState;
      modelManager.setNewModel(gameContent);
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
    if (languageData === USE_DEFAULT_LANGUAGE) {
      updateTranslation({ translationData: undefined });
    } else {
      updateTranslation({ translationData: languageData });
    }

    if (gameStateRef.current) {
      setClientSettings({ skipMode: true });
      console.log("provide new game content");
      modelManager.setNewModel(gameContent);
      // rerender((s) => (s + 1) % 100);
    }
  }, [gameContent, languageData]);

  useEffect(() => {
    const unsubscribe = subscribeClientSettings((newSettings, oldSettings) => {
      if (newSettings.currentLocale !== oldSettings.currentLocale) {
        queryClient.invalidateQueries(["languageContent"]);
        // rerender((s) => (s + 1) % 100);
      }
    });
    return unsubscribe;
  }, [queryClient]);

  if (isInitialLoading || !gameContent || !gameStateRef.current) {
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
