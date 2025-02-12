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

type ListsHelper<Game extends GameWorld, Actions = unknown> = {
  [K in keyof Game["lists"]]: {
    readonly has: (item: Game["lists"][K]) => boolean;
  } & Actions;
};

export type ScriptHelper<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = {
  readonly characters: CharactersHelper<
    Game,
    { readonly say: (...sentences: string[]) => void }
  >;
  readonly items: ItemsHelper<Game>;
  readonly locations: LocationsHelper<Game, { readonly travel: () => void }>;
  readonly overlays: OverlaysHelper<Game, { readonly open: () => void }>;
  readonly lists: ListsHelper<
    Game,
    {
      readonly addUnique: (item: Game["lists"][keyof Game["lists"]]) => void;
    }
  >;
  readonly text: (...sentences: string[]) => void;
} & ObjectState<Game, T, Item> & { name?: string };

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

export type NewScript<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = (worldHelper: ScriptHelper<Game, T, Item>) => void;

export type Interactions<
  Game extends GameWorld,
  T extends StateObject,
  Item extends keyof Game[`${T}s`]
> = (
  state: ReadStateHelper<Game, T, Item>,
  action: (
    name: string,
    condition: boolean,
    action: NewScript<Game, T, Item>
  ) => void
) => void;

export type OverlayObject<
  Game extends GameWorld,
  Overlay extends keyof Game["overlays"]
> = {
  prompt?: string;
  onEnter?: NewScript<Game, "overlay", Overlay>;
  onLeave?: NewScript<Game, "overlay", Overlay>;
  interactions?: Interactions<Game, "overlay", Overlay>;
};

export type LocationObject<
  Game extends GameWorld,
  Location extends keyof Game["locations"]
> = {
  prompt?: string;
  onEnter?: NewScript<Game, "location", Location>;
  onLeave?: NewScript<Game, "location", Location>;
  describe?: NewScript<Game, "location", Location>;
  interactions?: Interactions<Game, "location", Location>;
} & {
  [K in keyof Game["locations"] as `onEnterFrom${Capitalize<
    K & string
  >}`]?: NewScript<Game, "location", Location>;
} & {
  [K in keyof Game["locations"] as `onLeaveTo${Capitalize<
    K & string
  >}`]?: NewScript<Game, "location", Location>;
};
