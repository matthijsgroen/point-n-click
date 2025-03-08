import { createContext, PropsWithChildren, useState } from "react";
import { useGameData } from "./GameDataProvider";
import { GameWorld } from "../dsl/types/world";
import { GameState } from "../dsl/syntax/state";
import { PositionedRenderObject } from "../dsl/displayObjects";
import { Action } from "../dsl/execution/actions";
import { useRenderState } from "../hooks/useRenderState";
import { GameData } from "../dsl/syntax/dsl";
import { executeContentFlow } from "../dsl/execution/contentFlow";
import { useAction } from "../hooks/useAction";
import { useDisplayAction } from "../hooks/useDisplayAction";

export type GameInteraction = {
  label: string;
  enabled: boolean;
  shortcutKey?: string;
  execute: VoidFunction;
};

export const GameStateContext = createContext<{
  state: GameState<GameWorld>;
  renderState: PositionedRenderObject[];
  prompt: string;
  interactions: GameInteraction[];
  action: Action<GameWorld> | null;
  completeAction: VoidFunction;
}>({
  state: {} as GameState<GameWorld>,
  renderState: [],
  prompt: "",
  interactions: [],
  action: null,
  completeAction: () => {},
});

export const GameStateProvider = ({ children }: PropsWithChildren) => {
  const gameData = useGameData();
  const startingState = gameData.settings.initialState;
  const [state, setState] = useState(startingState);
  const [renderState, updateRenderState] = useRenderState<
    GameWorld,
    GameData<GameWorld>
  >(gameData);
  const { actions, interactions, prompt } = executeContentFlow(gameData, state);
  const { action, completeAction, allCompleted } = useAction(actions);
  useDisplayAction(action, updateRenderState, completeAction);

  return (
    <GameStateContext.Provider
      value={{
        state: state as unknown as GameState<GameWorld>,
        renderState,
        prompt,
        interactions: allCompleted
          ? []
          : interactions.map((interaction) => ({
              label: interaction.label,
              enabled: interaction.enabled,
              execute: () => {
                setState(interaction.action);
              },
            })),
        action: action as unknown as Action<GameWorld>,
        completeAction,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};
