import { useState } from "react";
import { getInteractions } from "../dsl/execution/getInteractions";
import { runScript } from "../dsl/execution/runScript";
import { GameState } from "../dsl/syntax/script";
import { GameWorldDSL } from "../dsl/syntax/world";
import { RecursivePartial } from "../dsl/types/utils";
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

  const [state, setState] = useState(gameData.settings.initialState);
  const { actionList } = runScript(overlay.onEnter!, state);
  const interactions = getInteractions(
    overlay.interactions!,
    state as RecursivePartial<GameState<Game>>,
    "overlay",
    "bakerConversation"
  );

  return (
    <>
      <h1>{gameData.settings.gameTitle}</h1>
      <h2>Script</h2>
      <ul>
        {actionList.map((action, index) => (
          <li key={index}>{JSON.stringify(action)}</li>
        ))}
      </ul>
      <h2>Interactions</h2>
      <strong>{overlay.prompt}</strong>
      <ul>
        {interactions
          .filter((e) => e.enabled)
          .map((action, index) => (
            <li key={index}>
              <button>{action.name}</button>
            </li>
          ))}
      </ul>
    </>
  );
};

export default App;
