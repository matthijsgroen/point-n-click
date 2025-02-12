import { useState } from "react";
import { GameWorldDSL } from "../dsl/syntax/dsl";
import { GameWorld } from "../dsl/types/world";
import "./App.css";
import { executeContentFlow } from "../dsl/execution/contentFlow";

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
  const [state] = useState(startingState);

  const { actions, interactions, prompt } = executeContentFlow(state);

  // const overlay = gameData.overlays["bakerConversation"];

  // const actionList = runScript(
  //   overlay.onEnter!,
  //   state,
  //   "overlay",
  //   "bakerConversation"
  // );
  // const interactions = getInteractions(
  //   overlay.interactions!,
  //   state,
  //   "overlay",
  //   "bakerConversation"
  // );

  return (
    <>
      <h1>{gameData.settings.gameTitle}</h1>
      <h2>Script</h2>
      <div>Active Interaction: {state.currentInteraction ?? "<none>"}</div>
      <ul>
        {actions.map((action, index) => (
          <li key={index}>{JSON.stringify(action)}</li>
        ))}
      </ul>
      <h2>Interactions</h2>
      <strong>{prompt}</strong>
      <ul>
        {interactions.map((action, index) =>
          action.enabled ? (
            <li key={index}>
              <button
                onClick={() => {
                  // setActiveInteraction(index);
                }}
              >
                {action.name}
              </button>
            </li>
          ) : null
        )}
      </ul>
    </>
  );
};

export default App;
