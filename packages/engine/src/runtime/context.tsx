import { createContext, PropsWithChildren, useMemo, useState } from "react";
import { GameState } from "../dsl/syntax/state";
import { GameSettings, GameWorld } from "../dsl/types/world";
import { PositionedRenderObject } from "../dsl/displayObjects";
import { GameData, GameWorldDSL } from "../dsl/syntax/dsl";
import { Action } from "../dsl/execution/actions";
import { executeContentFlow } from "../dsl/execution/contentFlow";
import { useRenderState } from "../hooks/useRenderState";
import { useAction } from "../hooks/useAction";
import { useDisplayAction } from "../hooks/useDisplayAction";

export type GameInteraction = {
  label: string;
  enabled: boolean;
  shortcutKey?: string;
  execute: VoidFunction;
};

export const GameContext = createContext<{
  state: GameState<GameWorld>;
  renderState: PositionedRenderObject[];
  prompt: string;
  interactions: GameInteraction[];
  gameData: GameData<GameWorld>;
  action: Action<GameWorld> | null;
  completeAction: VoidFunction;
}>({
  gameData: {} as GameData<GameWorld>,
  state: {} as GameState<GameWorld>,
  renderState: [],
  prompt: "",
  interactions: [],
  action: null,
  completeAction: () => {},
});

type Props<
  Game extends GameWorld,
  Settings extends GameSettings,
  GameDSL extends GameWorldDSL<number, Game, Settings>
> = {
  game: GameDSL;
};

export const GameProvider = <
  TGame extends GameWorld,
  TSettings extends GameSettings,
  TGameDSL extends GameWorldDSL<number, TGame, TSettings>
>({
  game,
  children,
}: PropsWithChildren<Props<TGame, TSettings, TGameDSL>>) => {
  const gameData = useMemo(() => game.compile(), [game]);
  const startingState = gameData.settings.initialState;
  const [state, setState] = useState(startingState);
  const [renderState, updateRenderState] = useRenderState<
    TGame,
    GameData<TGame>
  >(gameData);
  const { actions, interactions, prompt } = executeContentFlow(gameData, state);
  const { action, completeAction, allCompleted } = useAction(actions);
  useDisplayAction(action, updateRenderState, completeAction);

  return (
    <GameContext.Provider
      value={{
        gameData: gameData as unknown as GameData<GameWorld>,
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
    </GameContext.Provider>
  );
};
