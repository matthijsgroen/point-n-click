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
import { createDefaultState, emptyGameModel } from "@point-n-click/state";
import {
  GameModel,
  GameSaveStateManager,
  GameState,
  GameStateManager,
  GameWorld,
  Locale,
  TranslationFile,
  createState,
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

export const useGameState = (): GameSaveStateManager<GameWorld> & {
  setInteraction: Dispatch<string>;
} => {
  const gameState = useContext(GameStateContext);

  return {
    activeState: () =>
      createState(gameState.stateRef.current) as GameStateManager<GameWorld>,
    stableState: () =>
      createState(gameState.gameSavePointState) as GameStateManager<GameWorld>,
    updateState: (action) => {},
    getState: () => gameState.stateRef.current as GameState<GameWorld>,
    getSaveState: () => gameState.gameSavePointState as GameState<GameWorld>,
    storeInput: (key: string, value: unknown) => {},

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

  const [, rerender] = useState(0); // Required as trigger after a language update.

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
    if (saveData !== gameSavePointState && saveData !== undefined) {
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
      modelManager.setNewModel(gameContent);
      rerender((s) => (s + 1) % 100); // required to reload and use new model / language data
    }
  }, [gameContent, languageData]);

  useEffect(() => {
    const unsubscribe = subscribeClientSettings((newSettings, oldSettings) => {
      if (newSettings.currentLocale !== oldSettings.currentLocale) {
        queryClient.invalidateQueries(["languageContent"]);
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
