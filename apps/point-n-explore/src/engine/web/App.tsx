import { useState } from "react";
import { getInteractions } from "../dsl/execution/getInteractions";
import { runScript } from "../dsl/execution/runScript";
import { GameWorldDSL } from "../dsl/syntax/dsl";
import { GameWorld } from "../dsl/types/world";
import "./App.css";

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
  const overlay = gameData.overlays["bakerConversation"];
  const startingState = gameData.settings.initialState;

  const [state] = useState(startingState);
  const [activeInteraction, setActiveInteraction] = useState<number | null>(
    null
  );

  let actionList = runScript(
    overlay.onEnter!,
    state,
    "overlay",
    "bakerConversation"
  );
  let interactions = getInteractions(
    overlay.interactions!,
    state,
    "overlay",
    "bakerConversation"
  );
  let nextState = state;

  if (activeInteraction !== null) {
    const interaction = interactions[activeInteraction];
    if (interaction) {
      actionList = runScript(
        interaction.actionScript,
        state,
        "overlay",
        "bakerConversation"
      );
      nextState = actionList.reduce((state, action) => {
        if (action.type === "state") {
          return action.patch(state);
        }
        return state;
      }, nextState);
      interactions = getInteractions(
        overlay.interactions!,
        nextState,
        "overlay",
        "bakerConversation"
      );
    }
  }

  return (
    <>
      <h1>{gameData.settings.gameTitle}</h1>
      <h2>Script</h2>
      <div>Active Interaction: {activeInteraction ?? "<none>"}</div>
      <ul>
        {actionList.map((action, index) => (
          <li key={index}>{JSON.stringify(action)}</li>
        ))}
      </ul>
      <h2>Interactions</h2>
      <strong>{overlay.prompt}</strong>
      <ul>
        {interactions.map((action, index) =>
          action.enabled ? (
            <li key={index}>
              <button
                onClick={() => {
                  setActiveInteraction(index);
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
