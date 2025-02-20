import { CustomIfStatement } from "../execution/customIfStatement";
import { Interaction } from "../execution/getInteractions";
import {
  BaseContentPlugin,
  ContentExtension,
  DSLExtension,
} from "../types/plugins";
import { GameWorld, StateObject } from "../types/world";
import { ObjectState, ObjectGroupState } from "./state";

type CharactersHelper<
  Game extends GameWorld,
  Actions = unknown
> = ObjectGroupState<Game, "character", { name: string } & Actions>;

type ItemsHelper<Game extends GameWorld, Actions = unknown> = ObjectGroupState<
  Game,
  "item",
  { name?: string } & Actions
>;

type LocationsHelper<
  Game extends GameWorld,
  Actions = unknown
> = ObjectGroupState<Game, "location", { name: string } & Actions>;

type OverlaysHelper<
  Game extends GameWorld,
  Actions = unknown
> = ObjectGroupState<Game, "overlay", Actions>;

export type ScenesHelper<Game extends GameWorld, Actions = unknown> = {
  [K in Game["scenes"]]: Actions;
};

type ListsHelper<Game extends GameWorld, Actions = unknown> = {
  [K in keyof Game["lists"]]: {
    readonly has: (item: Game["lists"][K]) => boolean;
  } & Actions;
};

export type ActionFunctions<T extends DSLExtension | ContentExtension> = {
  [K in keyof T]: ReturnType<T[K]>;
};

export type ScriptHelper<
  Game extends GameWorld,
  Plugins extends readonly BaseContentPlugin[] = []
> = {
  readonly characters: CharactersHelper<
    Game,
    { readonly say: (...sentences: string[]) => void }
  >;
  readonly items: ItemsHelper<Game>;
  readonly locations: LocationsHelper<Game, { readonly travel: () => void }>;
  readonly overlays: OverlaysHelper<Game, { readonly open: () => void }>;
  readonly scenes: ScenesHelper<Game, { readonly play: () => void }>;
  readonly lists: ListsHelper<
    Game,
    {
      readonly addUnique: (item: Game["lists"][keyof Game["lists"]]) => void;
      readonly remove: (item: Game["lists"][keyof Game["lists"]]) => void;
    }
  >;
  readonly text: (...sentences: string[]) => void;
  /**
   * By using this custom if statement, you can chain multiple conditions and actions together.
   * The engine will be able to browse all content when using this custom if statement, to collect
   * all potentially used assets and text for translation.
   *
   * @example
   *
   * ```typescript
   *   customIfStatement(someIfCondition, () => {
   *     console.log("This is an 'if'");
   *   }).else(someElseCondition, () => {
   *     console.log("This is an 'if else'");
   *   }).else( () => {
   *     console.log("This is an 'else'");
   *   });
   * ```
   */
  readonly if: CustomIfStatement;
} & (Plugins extends readonly [BaseContentPlugin, ...BaseContentPlugin[]]
  ? ActionFunctions<Plugins[number]["actions"]>
  : {});

export type ObjectScriptHelper<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`],
  Plugins extends readonly BaseContentPlugin[] = []
> = ScriptHelper<Game, Plugins> &
  ObjectState<Game, T, Item> & { name?: string };

export type ReadStateHelper<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = {
  readonly characters: CharactersHelper<Game>;
  readonly items: ItemsHelper<Game>;
  readonly locations: LocationsHelper<Game>;
  readonly overlays: OverlaysHelper<Game>;
  readonly lists: ListsHelper<Game>;
} & ObjectState<Game, T, Item> & { name?: string };

export type Script<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`],
  Plugins extends readonly BaseContentPlugin[] = [],
  ExtraActions = unknown
> = (
  worldHelper: ObjectScriptHelper<Game, T, Item, Plugins> & ExtraActions
) => void;

export type SceneScript<
  Game extends GameWorld,
  Plugins extends readonly BaseContentPlugin[] = [],
  ExtraActions = unknown
> = (worldHelper: ScriptHelper<Game, Plugins> & ExtraActions) => void;

export type Interactions<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`],
  Plugins extends readonly BaseContentPlugin[] = [],
  ExtraActions = unknown
> = (
  state: ReadStateHelper<Game, T, Item> & {
    readonly addAction: (
      action: Interaction<Game, T, Item, Plugins, ExtraActions>
    ) => void;
  }
) => void;

export type OverlayObject<
  Game extends GameWorld,
  Overlay extends keyof Game["overlays"],
  Plugins extends readonly BaseContentPlugin[]
> = {
  prompt?: string;
  onEnter?: Script<
    Game,
    "overlay",
    Overlay,
    Plugins,
    { readonly closeOverlay: () => void }
  >;
  onLeave?: Script<Game, "overlay", Overlay, Plugins>;
  interactions?: Interactions<
    Game,
    "overlay",
    Overlay,
    Plugins,
    { readonly closeOverlay: () => void }
  >;
};

export type LocationObject<
  Game extends GameWorld,
  Location extends keyof Game["locations"],
  Plugins extends readonly BaseContentPlugin[]
> = {
  prompt?: string;
  onEnter?: Script<Game, "location", Location, Plugins>;
  onLeave?: Script<Game, "location", Location, Plugins>;
  describe?: Script<Game, "location", Location, Plugins>;
  interactions?: Interactions<Game, "location", Location, Plugins>;
} & {
  [K in keyof Game["locations"] as `onEnterFrom${Capitalize<
    K & string
  >}`]?: Script<Game, "location", Location, Plugins>;
} & {
  [K in keyof Game["locations"] as `onLeaveTo${Capitalize<
    K & string
  >}`]?: Script<Game, "location", Location, Plugins>;
};
