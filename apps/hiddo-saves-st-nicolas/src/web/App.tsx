import { useState } from "react";
import type {
  GameWorldDSL,
  GameWorld,
  GameSettings,
  GameData,
} from "@point-n-click/engine";
import {
  executeContentFlow,
  RenderDisplayAction,
  useAction,
  useRenderState,
  Viewport,
} from "@point-n-click/engine";
import { RenderText } from "./RenderText";
import { RenderSay } from "./RenderSay";

type Props<
  Game extends GameWorld,
  Settings extends GameSettings,
  GameDSL extends GameWorldDSL<number, Game, Settings>
> = {
  game: GameDSL;
};

const App = <
  Game extends GameWorld,
  Settings extends GameSettings,
  GameDSL extends GameWorldDSL<number, Game, Settings>
>({
  game,
}: Props<Game, Settings, GameDSL>) => {
  const gameData = game.compile();
  const startingState = gameData.settings.initialState;
  const [state, setState] = useState(startingState);
  const [renderState, updateRenderState] = useRenderState<Game, GameData<Game>>(
    gameData
  );

  const { actions, interactions, prompt } = executeContentFlow(gameData, state);
  const { action, completeAction, allCompleted } = useAction(actions);

  return (
    <main className="mx-auto py-4 flex flex-col gap-4">
      <h1 className="text-3xl mx-4 mb-3">{gameData.settings.gameTitle}</h1>
      <Viewport width={1280} height={720} renderState={renderState}>
        {action.type === "displayObject" && (
          <RenderDisplayAction
            action={action}
            onComplete={completeAction}
            updateRenderState={updateRenderState}
          />
        )}
        {action.type === "text" && (
          <RenderText action={action} onComplete={completeAction} />
        )}
        {action.type === "say" && (
          <RenderSay
            action={action}
            state={state}
            onComplete={completeAction}
          />
        )}
      </Viewport>

      <div className="text-gray-500 font-mono">{JSON.stringify(action)}</div>
      {/* <div className="bg-gray-400 py-2 px-4 rounded text-white">
        Active Interaction: {state.currentInteraction ?? "<none>"}
      </div> 
      <ul>
        {actions.map((action, index) => {
          if (action.type === "text") {
            return (
              <li key={index}>
                {action.text.map((line) => (
                  <Fragment key={line}>
                    {line}
                    <br />
                  </Fragment>
                ))}
              </li>
            );
          }

          if (action.type === "say") {
            return (
              <li
                key={index}
                className="italic my-2 grid grid-cols-[min-content_1fr] gap-2"
              >
                <span>
                  <strong>{state.characters[action.character].name}</strong>:{" "}
                </span>
                <div>
                  {action.text.map((line) => (
                    <Fragment key={line}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
                </div>
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

          if (action.type === "displayObject") {
            const renderState = updateRenderState(action);
            return (
              <li key={index} className="text-gray-500 font-mono my-2">
                {JSON.stringify(renderState)}
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
      {allCompleted && (
        <>
          <strong>{prompt}</strong>
          <ul className="flex flex-col gap-2">
            {interactions.map((action, index) =>
              action.enabled ? (
                <li key={index}>
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                      setState(action.action);
                    }}
                  >
                    {action.label}
                  </button>
                </li>
              ) : null
            )}
          </ul>
        </>
      )}
    </main>
  );
};

export default App;
