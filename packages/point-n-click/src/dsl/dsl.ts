import {
  GameWorld,
  OverlayScript,
  LocationScript,
  EvaluateCondition,
  ScriptAST,
  ScriptStatement,
  GameOverlay,
  GameLocation,
  GlobalInteraction,
  ContentPlugin,
  DSLExtension,
  SystemInterface,
} from "@point-n-click/types";
import { GameModel, Settings, ThemeInfo } from "@point-n-click/state";
import { characterDSLFunctions, CharacterInterface } from "./character";
import { ConditionSet, dslStateConditions } from "./dsl-conditions";
import { itemDSLFunctions, ItemInterface } from "./item";
import { locationDSLFunctions, LocationInterface } from "./location";
import { ThemeSettings } from "@point-n-click/themes";
import {
  BasePuzzleEventStates,
  PuzzleDependencyDiagram,
} from "@point-n-click/puzzle-dependency-diagram";

type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R
) => any
  ? R
  : never;

type FunctionExceptFirst<F> = F extends (
  head: SystemInterface,
  ...rest: infer R
) => void
  ? (...args: R) => void
  : never;

type RemapFunctions<T extends DSLExtension> = {
  [K in keyof T]: FunctionExceptFirst<T[K]>;
};

interface ThemeWithDSL<
  Settings extends ThemeSettings,
  Extensions extends ContentPlugin<DSLExtension>[]
> {
  name: string;
  version: string;
  author: string;
  packageName: string;
  settings: Settings;
  extensions: Extensions;
}

type ThemeDSLMap<
  ThemeMap extends ThemeWithDSL<ThemeSettings, ContentPlugin<DSLExtension>[]>[]
> = RemapFunctions<ThemeMap[number]["extensions"][number]["dslFunctions"]>;

type GameWorldDSL<Version extends number, Game extends GameWorld<Version>> = {
  defineOverlay: (
    id: Game["overlays"],
    handleOverlay: OverlayScript<Game>
  ) => void;
  defineLocation: <Location extends keyof Game["locations"]>(
    location: Location,
    script: LocationScript<Game, Location>
  ) => void;
  definePuzzleDependencies: <MetaData extends BasePuzzleEventStates>(
    diagram: PuzzleDependencyDiagram<MetaData>
  ) => void;
  globalInteraction: GlobalInteraction<Game>;

  text: (...sentences: string[]) => void;
  describeLocation: () => void;
  openOverlay: (id: Game["overlays"]) => void;

  onState: EvaluateCondition<Game>;

  __exportWorld: () => GameModel<Game>;
} & CharacterInterface<Game> &
  ItemInterface<Game> &
  LocationInterface<Game> &
  ConditionSet<Game>;

export type GameDefinition<
  Version extends number,
  Game extends GameWorld<Version>
> = Game;

/**
 * This is the starting point of your adventure.
 *
 * `world` converts a model of a game world into
 * a domain specific language to define your game's content.
 *
 * @param settings
 * @returns
 */
export const world =
  <Game extends GameWorld<number>>(settings: Settings<Game>) =>
  <T extends ThemeWithDSL<ThemeSettings, ContentPlugin<DSLExtension>[]>[]>(
    ...themes: T
  ): GameWorldDSL<Game["version"], Game> &
    UnionToIntersection<ThemeDSLMap<T>> => {
    let worldModel: GameModel<Game> = {
      settings,
      locations: [],
      overlays: [],
      globalInteractions: [],
      themes: themes.map<ThemeInfo>((t) => ({
        themePackage: t.packageName,
        name: t.name,
        settings: t.settings,
      })),
      diagram: {
        events: {},
      },
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

    const onState: EvaluateCondition<Game> = (
      condition,
      script,
      elseScript
    ) => {
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

    const baseDSL: GameWorldDSL<Game["version"], Game> = {
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
          onEnter: (
            from: Exclude<keyof Game["locations"], Location>,
            script
          ) => {
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
        worldModel?.locations.push(
          locationAST as unknown as GameLocation<Game>
        );
      },
      definePuzzleDependencies: (diagram) => {
        worldModel.diagram = diagram;
      },
      globalInteraction: (text, shortcutKey, condition, script) => {
        worldModel.globalInteractions.push({
          label: text,
          condition,
          shortcutKey,
          script: wrapScript(script),
        });
      },

      ...characterDSLFunctions(addToActiveScript),
      ...itemDSLFunctions(addToActiveScript),
      ...locationDSLFunctions(addToActiveScript),

      text: (...sentences) => {
        addToActiveScript({
          statementType: "Text",
          sentences,
        });
      },
      describeLocation: () => {
        addToActiveScript({
          statementType: "DescribeLocation",
        });
      },
      openOverlay: (id) => {
        addToActiveScript({
          statementType: "OpenOverlay",
          overlayId: id,
        });
      },
      onState,
      ...dslStateConditions<Game>(),
      __exportWorld: () => worldModel,
    };

    const createSystemInterface = (
      contentPlugin: ContentPlugin<DSLExtension>
    ): SystemInterface => ({
      addContent: (item) => {
        activeScriptScope.push({ ...item, source: contentPlugin.pluginType });
      },
    });

    const pluginDSLFunctions: Record<string, (...args: any[]) => void> = {};

    for (const theme of themes) {
      for (const contentPlugin of theme.extensions) {
        const systemInterface = createSystemInterface(contentPlugin);
        for (const [name, func] of Object.entries(contentPlugin.dslFunctions)) {
          pluginDSLFunctions[name] = (...args) => {
            func(systemInterface, ...args);
          };
        }
      }
    }

    return { ...baseDSL, ...pluginDSLFunctions } as unknown as GameWorldDSL<
      Game["version"],
      Game
    > &
      UnionToIntersection<ThemeDSLMap<T>>;
  };
