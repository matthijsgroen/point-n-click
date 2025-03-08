import { use, createContext, PropsWithChildren, useMemo } from "react";
import { GameSettings, GameWorld } from "../dsl/types/world";
import { GameData, GameWorldDSL } from "../dsl/syntax/dsl";

const GameDataContext = createContext<{
  gameData: GameData<GameWorld>;
}>({
  gameData: {} as GameData<GameWorld>,
});

type Props = {
  game: GameWorldDSL<number, GameWorld, GameSettings>;
};

export const useGameData = () => {
  return use(GameDataContext).gameData;
};

export const GameDataProvider = ({
  game,
  children,
}: PropsWithChildren<Props>) => {
  const gameData = useMemo(() => game.compile(), [game]);

  return (
    <GameDataContext.Provider value={{ gameData }}>
      {children}
    </GameDataContext.Provider>
  );
};
