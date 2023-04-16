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
  Script,
  GameModel,
  Settings,
  ThemeInfo,
} from "@point-n-click/types";
import { characterDSLFunctions, CharacterInterface } from "./character";
import { ConditionSet, dslStateConditions } from "./dsl-conditions";
import { itemDSLFunctions, ItemInterface } from "./item";
import { locationDSLFunctions, LocationInterface } from "./location";
import { listDSLFunctions, ListInterface } from "./list";
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
  Extensions extends readonly ContentPlugin<DSLExtension>[]
> {
  name: string;
  version: string;
  author: string;
  packageName: string;
  settings: Settings;
  extensions: Extensions;
}

type ThemeDSLMap<
  ThemeMap extends ThemeWithDSL<
    ThemeSettings,
    readonly ContentPlugin<DSLExtension>[]
  >[]
> = RemapFunctions<ThemeMap[number]["extensions"][number]["dslFunctions"]>;

type GameWorldDSL<Version extends number, Game extends GameWorld<Version>> = {
  /**
   * # Overlay
   *
   * Define overlay content. Useful for inventory management,
   * character conversations, etc. Overlays can be stacked,
   * so you could open your inventory while in an character conversation.
   *
   * Functions available in overlayScript:
   *
   * - onEnter
   * - onLeave
   * - closeOverlay
   * - hasState
   * - setState
   */
  defineOverlay: <Overlay extends keyof Game["overlays"]>(
    id: Overlay,
    handleOverlay: OverlayScript<Game, Overlay>
  ) => void;
  /**
   * # Location
   *
   * Define a location. A location is a physical space in the game.
   *
   * Functions available in locationScript:
   *
   * - onEnter
   * - onLeave
   * - describe
   * - hasState
   * - setState
   */
  defineLocation: <Location extends keyof Game["locations"]>(
    location: Location,
    script: LocationScript<Game, Location>
  ) => void;
  definePuzzleDependencies: <MetaData extends BasePuzzleEventStates>(
    diagram: PuzzleDependencyDiagram<MetaData>
  ) => void;
  globalInteraction: GlobalInteraction<Game>;

  text: (...sentences: string[]) => void;
  contentDecoration: (type: string, script: Script) => void;
  describeLocation: () => void;
  openOverlay: (id: keyof Game["overlays"]) => void;

  onState: EvaluateCondition<Game>;

  __exportWorld: () => GameModel<Game>;
} & CharacterInterface<Game> &
  ItemInterface<Game> &
  LocationInterface<Game> &
  ListInterface<Game> &
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
  <
    T extends ThemeWithDSL<
      ThemeSettings,
      readonly ContentPlugin<DSLExtension>[]
    >[]
  >(
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

    const wrapScript = (execution: Script): ScriptAST<Game> => {
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
      defineOverlay: <Overlay extends keyof Game["overlays"]>(
        overlay: Overlay,
        handleOverlay: OverlayScript<Game, Overlay>
      ) => {
        const overlayAST: GameOverlay<Game> = {
          id: overlay,
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
              overlayId: overlay,
            });
          },
          setState: (newState) => {
            activeScriptScope.push({
              statementType: "UpdateGameObjectState",
              objectType: "overlay",
              stateItem: overlay,
              newState,
            });
          },
          hasState: (state) => ({
            objectType: "overlay",
            item: overlay,
            op: "StateEquals",
            state,
          }),
          setPrompt: (prompt) => {
            overlayAST.prompt = prompt;
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
          setState: (newState) => {
            activeScriptScope.push({
              statementType: "UpdateGameObjectState",
              objectType: "location",
              stateItem: location,
              newState,
            });
          },
          hasState: (state) => ({
            objectType: "location",
            item: location,
            op: "StateEquals",
            state,
          }),
          setPrompt: (prompt) => {
            locationAST.prompt = prompt;
          },
        });
        worldModel?.locations.push(
          locationAST as unknown as GameLocation<Game>
        );
      },
      contentDecoration: (decorationType: string, script: Script) => {
        addToActiveScript({
          statementType: "ContentDecoration",
          decorationType,
          content: wrapScript(script),
        });
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
      ...listDSLFunctions(addToActiveScript, wrapScript),

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
      addPluginContent: (item) => {
        activeScriptScope.push({ ...item, source: contentPlugin.pluginType });
      },
      addBaseContent: (item) => {
        activeScriptScope.push(item as unknown as ScriptStatement<Game>);
      },
      wrapScript: (execution: Script) =>
        wrapScript(execution) as ScriptAST<GameWorld>,
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
