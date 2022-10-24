import {
  GameWorld,
  OverlayScript,
  LocationScript,
  EvaluateCondition,
  ScriptAST,
  ScriptStatement,
  GameOverlay,
  GameLocation,
} from "@point-n-click/types";
import { GameModel, Settings } from "@point-n-click/state";
import { characterDSLFunctions, CharacterInterface } from "./character";
import { ConditionSet, dslStateConditions } from "./dsl-conditions";
import { itemDSLFunctions, ItemInterface } from "./item";
import { locationDSLFunctions, LocationInterface } from "./location";

type GameWorldDSL<Game extends GameWorld> = {
  defineOverlay: (
    id: Game["overlays"],
    handleOverlay: OverlayScript<Game>
  ) => void;
  defineLocation: <Location extends keyof Game["locations"]>(
    location: Location,
    script: LocationScript<Game, Location>
  ) => void;

  text: (...sentences: string[]) => void;
  openOverlay: (id: Game["overlays"]) => void;

  onState: EvaluateCondition<Game>;

  __exportWorld: () => GameModel<Game>;
} & CharacterInterface<Game> &
  ItemInterface<Game> &
  LocationInterface<Game> &
  ConditionSet<Game>;

export type GameDefinition<Game extends GameWorld> = Game;

/**
 * This is the starting point of your adventure.
 *
 * `world` converts a model of a game world into
 * a domain specific language to define your game's content.
 *
 * @param settings
 * @returns
 */
export const world = <Game extends GameWorld>(
  settings: Settings<Game>
): GameWorldDSL<Game> => {
  let worldModel: GameModel<Game> = {
    settings: settings as Settings<Game>,
    locations: [],
    overlays: [],
    themes: [],
  };

  let activeScriptScope: ScriptAST<Game> = [];

  const wrapScript = (execution: () => void): ScriptAST<Game> => {
    const previousScript = activeScriptScope;
    const script: ScriptAST<Game> = [];

    activeScriptScope = script;
    execution();
    const result = activeScriptScope;
    activeScriptScope = previousScript;
    return result;
  };

  const onState: EvaluateCondition<Game> = (condition, script, elseScript) => {
    const body = wrapScript(script);
    const elseBody = elseScript ? wrapScript(elseScript) : [];
    activeScriptScope.push({
      statementType: "Condition",
      condition,
      body,
      elseBody,
    });
  };

  const addToActiveScript = (statement: ScriptStatement<Game>) => {
    activeScriptScope.push(statement);
  };

  return {
    defineOverlay: (
      id: Game["overlays"],
      handleOverlay: OverlayScript<Game>
    ) => {
      const overlayAST: GameOverlay<Game> = {
        id,
        onEnter: { script: [] },
        onLeave: { script: [] },
        interactions: [],
      };

      handleOverlay({
        onEnter: (script) => {
          const startScript = wrapScript(script);
          overlayAST.onEnter.script = startScript;
        },
        onLeave: (script) => {
          const endScript = wrapScript(script);
          overlayAST.onLeave.script = endScript;
        },
        interaction: (label, condition, script) => {
          const interactionScript = wrapScript(script);
          overlayAST.interactions.push({
            label,
            condition,
            script: interactionScript,
          });
        },
        closeOverlay: () => {
          activeScriptScope.push({
            statementType: "CloseOverlay",
            overlayId: id,
          });
        },
      });
      worldModel?.overlays.push(overlayAST as unknown as GameOverlay<Game>);
    },
    defineLocation: <Location extends keyof Game["locations"]>(
      location: Location,
      script: LocationScript<Game, Location>
    ) => {
      const locationAST: GameLocation<Game> = {
        id: location,
        describe: { script: [] },
        onEnter: [],
        onLeave: [],
        interactions: [],
      };
      script({
        describe: (script) => {
          const description = wrapScript(script);
          locationAST.describe = { script: description };
        },
        onEnter: (from: Exclude<keyof Game["locations"], Location>, script) => {
          const enterScript = wrapScript(script);
          locationAST.onEnter.push({
            from,
            script: enterScript,
          });
        },
        onLeave: (to: Exclude<keyof Game["locations"], Location>, script) => {
          const enterScript = wrapScript(script);
          locationAST.onLeave.push({
            to,
            script: enterScript,
          });
        },
        interaction: (label, condition, script) => {
          const interactionScript = wrapScript(script);
          locationAST.interactions.push({
            label,
            condition,
            script: interactionScript,
          });
        },
      });
      worldModel?.locations.push(locationAST as unknown as GameLocation<Game>);
    },
    ...characterDSLFunctions(addToActiveScript),
    ...itemDSLFunctions(addToActiveScript),
    ...locationDSLFunctions(addToActiveScript),

    text: (...sentences: string[]) => {
      addToActiveScript({
        statementType: "Text",
        sentences,
      });
    },
    openOverlay: (id: Game["overlays"]) => {
      addToActiveScript({
        statementType: "OpenOverlay",
        overlayId: id,
      });
    },
    onState,
    ...dslStateConditions<Game>(),
    __exportWorld: () => worldModel,
  };
};