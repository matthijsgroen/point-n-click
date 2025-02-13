import { useState } from "react";
import { GameWorldDSL } from "../dsl/syntax/dsl";
import { GameWorld } from "../dsl/types/world";
import { executeContentFlow } from "../dsl/execution/contentFlow";
import { produce } from "immer";
import { GameState } from "../dsl/syntax/state";

type Props<
  Game extends GameWorld,
  GameDSL extends GameWorldDSL<number, Game>
> = {
  game: GameDSL;
};

const App = <
  Game extends GameWorld,
  GameDSL extends GameWorldDSL<number, Game>
>({
  game,
}: Props<Game, GameDSL>) => {
  const gameData = game.compile();
  const startingState = gameData.settings.initialState;
  const [state, setState] = useState(startingState);

  const { actions, interactions, prompt } = executeContentFlow(gameData, state);
  const pendingPatches: ((state: GameState<Game>) => GameState<Game>)[] = [];

  return (
    <main className="max-w-3xl mx-auto p-4 flex flex-col gap-4">
      <h1 className="text-3xl mb-3">{gameData.settings.gameTitle}</h1>
      <h2 className="text-xl mb-3">Script</h2>
      <div className="bg-gray-400 py-2 px-4 rounded text-white">
        Active Interaction: {state.currentInteraction ?? "<none>"}
      </div>
      <ul>
        {actions.map((action, index) => {
          if (action.type === "text") {
            return <li key={index}>{action.text}</li>;
          }

          if (action.type === "state") {
            pendingPatches.push(action.patch);
            return null;
          }

          if (action.type === "say") {
            return (
              <li key={index} className="italic my-2">
                <strong>{state.characters[action.character].name}</strong>:{" "}
                {action.text.join(" ")}
              </li>
            );
          }

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
      <strong>{prompt}</strong>
      <ul className="flex flex-wrap gap-2">
        {interactions.map((action, index) =>
          action.enabled ? (
            <li key={index}>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  setState((state) => {
                    const accurateState = pendingPatches.reduce(
                      (draft, patch) => patch(draft),
                      state
                    );

                    return produce((draft) => {
                      draft.currentInteraction = action.name;
                    })(accurateState);
                  });
                }}
              >
                {action.name}
              </button>
            </li>
          ) : null
        )}
      </ul>
    </main>
  );
};

export default App;
