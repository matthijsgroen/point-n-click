import { PropsWithChildren } from "react";
import { GameSettings, GameWorld } from "../dsl/types/world";
import { GameWorldDSL } from "../dsl/syntax/dsl";
import { GameDataProvider } from "./GameDataProvider";
import { GameStateProvider } from "./GameStateProvider";

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
  return (
    <GameDataProvider
      game={game as unknown as GameWorldDSL<number, GameWorld, GameSettings>}
    >
      <GameStateProvider>{children}</GameStateProvider>
    </GameDataProvider>
  );
};
