import type {
  GameWorldDSL,
  GameWorld,
  GameSettings,
} from "@point-n-click/engine";
import { GameProvider, useGameData, Viewport } from "@point-n-click/engine";
import { RenderText } from "./RenderText";
import { RenderSay } from "./RenderSay";

type Props<
  Game extends GameWorld,
  Settings extends GameSettings,
  GameDSL extends GameWorldDSL<number, Game, Settings>
> = {
  game: GameDSL;
};

const GameTitle = () => {
  const gameData = useGameData();
  return <h1 className="text-3xl mx-4 mb-3">{gameData.settings.gameTitle}</h1>;
};

const App = <
  Game extends GameWorld,
  Settings extends GameSettings,
  GameDSL extends GameWorldDSL<number, Game, Settings>
>({
  game,
}: Props<Game, Settings, GameDSL>) => {
  return (
    <main className="mx-auto py-4 flex flex-col gap-4">
      <GameProvider<Game, Settings, GameDSL> game={game}>
        <GameTitle />
        <Viewport width={1280} height={720}>
          <RenderText />
          <RenderSay />
          {/*
          {action.type === "say" && (
            <RenderSay
              action={action}
              state={state}
              onComplete={completeAction}
            />
          )} */}
        </Viewport>

        {/* <div className="text-gray-500 font-mono">{JSON.stringify(action)}</div> */}
        {/* <div className="bg-gray-400 py-2 px-4 rounded text-white">
        Active Interaction: {state.currentInteraction ?? "<none>"}
      </div> 
      <ul>
        {actions.map((action, index) => {
          if (action.type === "error") {
            return (
              <li
                key={index}
                className="font-bold bg-red-600  text-white rounded-lg p-4 my-2"
              >
                ERROR: {action.message}
              </li>
            );
          }

          return (
            <li key={index} className="text-gray-500 font-mono">
              {JSON.stringify(action)}
            </li>
          );
        })} 
      </ul>
      */}
        {/* {interactions.length > 0 && (
          <>
            <strong>{prompt}</strong>
            <ul className="flex flex-col gap-2">
              {interactions.map((action, index) =>
                action.enabled ? (
                  <li key={index}>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={() => {
                        action.execute();
                      }}
                    >
                      {action.label}
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          </>
        )} */}
      </GameProvider>
    </main>
  );
};

export default App;
