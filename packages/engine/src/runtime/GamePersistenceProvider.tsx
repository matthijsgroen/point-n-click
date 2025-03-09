import {
  createContext,
  Dispatch,
  PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { GameWorld } from "../dsl/types/world";
import { GameState, getStore } from "../main";
import { useGameData } from "./GameDataProvider";

type PersistenceState = {
  actionIndex: number;
  state: GameState<GameWorld>;
};

type Mutator<T> = (previous: T) => T;

const GamePersistenceContext = createContext<{
  state: PersistenceState;
  updateState: Dispatch<Mutator<PersistenceState>>;
}>({
  state: {
    actionIndex: 0,
    state: {} as GameState<GameWorld>,
  },
  updateState: (x) => x,
});

export const usePersistenceState = <Key extends keyof PersistenceState>(
  key: Key
): [
  value: PersistenceState[Key],
  setValue: Dispatch<Mutator<PersistenceState[Key]>>
] => {
  const { state, updateState } = use(GamePersistenceContext);
  const [localState, setLocalState] = useState(state[key]);

  const updater = useCallback(
    (mutation: (previous: PersistenceState[Key]) => PersistenceState[Key]) => {
      setLocalState(mutation);

      const newState = mutation(state[key]);
      if (newState !== state[key]) {
        console.log("updating", key, state[key], " => ", newState);
        updateState((state) => ({
          ...state,
          [key]: newState,
        }));
      }
    },
    [updateState, setLocalState]
  );

  return [localState, updater];
};

type Props = PropsWithChildren<{
  storeName: string;
}>;

export const GamePersistenceProvider = ({ children, storeName }: Props) => {
  const gameData = useGameData();
  const initialState = gameData.settings.initialState;

  const store = getStore(storeName);

  const [persistenceState, setPersistenceState] = useState<
    PersistenceState | undefined
  >(undefined);

  useEffect(() => {
    // Loading

    // store
    //   .getItem<PersistenceState>("gameState")
    //   .then(async (value) => {
    //     if (value !== null) {
    //       setPersistenceState(value);
    //     } else {
    setPersistenceState({
      actionIndex: 0,
      state: initialState,
    });
    // }
    //   })
    //   .catch((_e) => {
    //     // 'Error getting item from store'
    //     setPersistenceState(undefined);
    //   });
  }, [store, initialState]);

  const state = useRef(persistenceState);

  const updateState = useCallback(
    (value: Mutator<PersistenceState>) => {
      //   setPersistenceState((previous) => {
      state.current = value(
        state.current ?? {
          actionIndex: 0,
          state: initialState,
        }
      );
      //   store.setItem("gameState", state.current);
    },
    [storeName, state]
  );

  if (persistenceState === undefined) {
    console.log("loading");
    return null;
  }

  return (
    <GamePersistenceContext.Provider
      value={{ state: persistenceState, updateState }}
    >
      {children}
    </GamePersistenceContext.Provider>
  );
};
