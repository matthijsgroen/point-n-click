import {
  GameObjectCounterCondition,
  GameObjectFlagCondition,
  GameObjectStateCondition,
  StateCondition,
} from "./conditions";
import { ContentPluginStatement } from "./contentPlugin";
import { StateObject } from "./state";
import { GameWorld, WorldObjectSettings } from "./world";

export type Script = () => void;

export type ObjectStateDSL<
  Game extends GameWorld,
  T extends StateObject,
  I extends keyof Game[`${T}s`]
> = {
  setState: (newState: Game[`${T}s`][I]["states"] | "unknown") => void;
  setFlag: (flag: Game[`${T}s`][I]["flags"]) => void;
  clearFlag: (flag: Game[`${T}s`][I]["flags"]) => void;
  setCounter: (
    counter: Game[`${T}s`][I]["counters"],
    value: number,
    randomAdd?: number
  ) => void;
  increaseCounter: (
    counter: Game[`${T}s`][I]["counters"],
    value?: number,
    randomIncrease?: number
  ) => void;
  decreaseCounter: (
    counter: Game[`${T}s`][I]["counters"],
    value?: number,
    randomDecrease?: number
  ) => void;
  setText: (key: Game[`${T}s`][I]["texts"], value: string) => void;
  hasState: (
    state: Game[`${T}s`][I]["states"] | "unknown"
  ) => GameObjectStateCondition<Game, T>;
  hasFlag: (
    flag: Game[`${T}s`][I]["flags"]
  ) => GameObjectFlagCondition<Game, T>;
  hasCounter: (counterName: Game[`${T}s`][I]["counters"]) => {
    equals: (value: number) => GameObjectCounterCondition<Game, T>;
    lessThan: (value: number) => GameObjectCounterCondition<Game, T>;
    lessThanEquals: (value: number) => GameObjectCounterCondition<Game, T>;
    moreThan: (value: number) => GameObjectCounterCondition<Game, T>;
    moreThanEquals: (value: number) => GameObjectCounterCondition<Game, T>;
  };
};

export type LocationScript<
  Game extends GameWorld,
  Location extends keyof Game["locations"]
> = (
  events: {
    onEnter: (
      from: Exclude<keyof Game["locations"], Location>,
      script: Script
    ) => void;
    onLeave: (
      to: Exclude<keyof Game["locations"], Location>,
      script: Script
    ) => void;
    describe: (script: Script) => void;
    interaction: Interaction<Game>;
    setPrompt: (
      interactionPrompt: string,
      condition?: StateCondition<Game>
    ) => void;
  } & ObjectStateDSL<Game, "location", Location>
) => void;

export type OverlayScript<
  Game extends GameWorld,
  Overlay extends keyof Game["overlays"]
> = (
  events: {
    onEnter: (script: Script) => void;
    onLeave: (script: Script) => void;
    interaction: Interaction<Game>;
    closeOverlay: () => void;
    setPrompt: (
      interactionPrompt: string,
      condition?: StateCondition<Game>
    ) => void;
  } & ObjectStateDSL<Game, "overlay", Overlay>
) => void;

export type ObjectStateHelper<Game extends GameWorld, T extends StateObject, Item extends keyof Game[`${T}s`]> = {
  [Flag in Exclude<Game[`${T}s`][Item]["flags"], undefined>]: boolean
} & {
  [Counter in Exclude<Game[`${T}s`][Item]["counters"], undefined>]: number
} & {
  name: string;
  state: Game[`${T}s`][Item]["states"] | "unknown";
}

export type ObjectReadStateHelper<Game extends GameWorld, T extends StateObject, Item extends keyof Game[`${T}s`]> = {
  readonly [Flag in Exclude<Game[`${T}s`][Item]["flags"], undefined>]: boolean
} & {
  readonly [Counter in Exclude<Game[`${T}s`][Item]["counters"], undefined>]: number
} & {
  readonly name: string;
  readonly state: Game[`${T}s`][Item]["states"] | "unknown";
}


export type CharactersHelper<Game extends GameWorld> = {
  [K in keyof Game["characters"]]: ObjectStateHelper<Game, "character", K> & {
    readonly say: (...sentences: string[]) => void;
  }
};

export type ItemsHelper<Game extends GameWorld> = {
  [K in keyof Game["items"]]: ObjectStateHelper<Game, "item", K>
};

export type LocationsHelper<Game extends GameWorld> = {
  [K in keyof Game["locations"]]: ObjectStateHelper<Game, "location", K> & {
    readonly travel: () => void;
  }
};

export type ListsHelper<Game extends GameWorld> = {
  [K in keyof Game["lists"]]:  {
    readonly addUnique: (item: Game["lists"][K]) => void;
    readonly has: (item: Game["lists"][K]) => boolean;
  }
};

export type ScriptHelper<
  Game extends GameWorld,
  T extends StateObject, Item extends keyof Game[`${T}s`]
  > = {
    readonly characters: CharactersHelper<Game>;
    readonly items: ItemsHelper<Game>;
    readonly locations: LocationsHelper<Game>;
    readonly lists: ListsHelper<Game>;
    readonly text: (...sentences: string[]) => void;
  } & ObjectStateHelper<Game, T, Item>;

export type NewScript<
  Game extends GameWorld,
  T extends StateObject, Item extends keyof Game[`${T}s`]
  > = (worldHelper: ScriptHelper<Game, T, Item>) => void;

export type ReadStateHelper<Game extends GameWorld, T extends StateObject> = {
  [K in keyof Game[`${T}s`]]: ObjectReadStateHelper<Game, T, K>
}

export type ReadListHelper<Game extends GameWorld> = {
  [K in keyof Game["lists"]]: { readonly has: (item: Game["lists"][K]) => boolean }
}

export type GameState<Game extends GameWorld> = {
  readonly characters: ReadStateHelper<Game, "character">;
  readonly locations: ReadStateHelper<Game, "location">;
  readonly overlays: ReadStateHelper<Game, "overlay">;
  readonly items: ReadStateHelper<Game, "item">;
  readonly lists: ReadListHelper<Game>;
}

export type Interactions<Game extends GameWorld, 
  T extends StateObject, Item extends keyof Game[`${T}s`]
> = (
  state: GameState<Game> & ObjectReadStateHelper<Game, T, Item>,
  action: (name: string, condition: boolean, action: NewScript<Game, T, Item>) => void
) => void;

export type OverlayObject<Game extends GameWorld, Overlay extends keyof Game["overlays"]> = {
  prompt?: string;
  onEnter?: NewScript<Game,"overlay", Overlay>;
  onLeave?: NewScript<Game,"overlay", Overlay>;
  interactions?: Interactions<Game, "overlay", Overlay>
}

export type EvaluateStateCondition<Game extends GameWorld> = (
  condition: StateCondition<Game>,
  script: Script
) => { else: ChainedStateCondition<Game> };

export type ChainedStateCondition<Game extends GameWorld> = {
  (condition: StateCondition<Game>, script: Script): {
    else: ChainedStateCondition<Game>;
  };
  (script: Script): void;
};

export type InteractionOptions = {
  shortcutKey?: string;
};

export type Interaction<Game extends GameWorld> = (
  text: string,
  condition: StateCondition<Game>,
  script: Script,
  options?: InteractionOptions
) => void;

export type GlobalInteraction<Game extends GameWorld> = (
  text: string,
  shortcutKey: string,
  condition: StateCondition<Game>,
  script: Script
) => void;

export type GameInteraction<Game extends GameWorld> = {
  label: string;
  condition: StateCondition<Game>;
  shortcutKey?: string;
  script: ScriptAST<Game>;
};

export type GameLocation<Game extends GameWorld> = {
  id: keyof Game["locations"];
  onEnter: { from: keyof Game["locations"]; script: ScriptAST<Game> }[];
  onLeave: { to: keyof Game["locations"]; script: ScriptAST<Game> }[];
  describe: { script: ScriptAST<Game> };
  interactions: GameInteraction<Game>[];
  prompts: { prompt: string; condition?: StateCondition<Game> }[];
};
export type GameOverlay<Game extends GameWorld> = {
  id: keyof Game["overlays"];
  onEnter: { script: ScriptAST<Game> };
  onLeave: { script: ScriptAST<Game> };
  interactions: GameInteraction<Game>[];
  prompts: { prompt: string; condition?: StateCondition<Game> }[];
};
export type GameScene<Game extends GameWorld> = {
  id: Game["scenes"];
  script: ScriptAST<Game>;
};
export type ScriptAST<Game extends GameWorld> = (
  | ScriptStatement<Game>
  | ContentPluginStatement
)[];

export type ScriptStatement<Game extends GameWorld> =
  | TextStatement
  | DescribeLocationStatement
  | TravelStatement<Game>
  | PlaySceneStatement<Game>
  | ConditionStatement<Game>
  | UpdateState<Game>
  | UpdateCounter<Game>
  | UpdateFlag<Game>
  | UpdateCharacterName<Game>
  | SetStateText<Game>
  | CharacterSay<Game>
  | OpenGameOverlay<Game>
  | CloseGameOverlay<Game>
  | AddListItem<Game>
  | RemoveListItem<Game>
  | DisplayList<Game>;

export type TextStatement = { statementType: "Text"; sentences: string[] };

export type DescribeLocationStatement = { statementType: "DescribeLocation" };

export type OpenGameOverlay<Game extends GameWorld> = {
  statementType: "OpenOverlay";
  overlayId: keyof Game["overlays"];
};

export type CloseGameOverlay<Game extends GameWorld> = {
  statementType: "CloseOverlay";
  overlayId: keyof Game["overlays"];
};

export type PlaySceneStatement<Game extends GameWorld> = {
  statementType: "PlayScene";
  scene: Game["scenes"];
};

export type TravelStatement<Game extends GameWorld> = {
  statementType: "Travel";
  destination: keyof Game["locations"];
};

export type ConditionStatement<Game extends GameWorld> = {
  statementType: "Condition";
  condition: StateCondition<Game>;
  body: ScriptAST<Game>;
  else?: ConditionElse<Game> | { body: ScriptAST<Game> };
};

export type ConditionElse<Game extends GameWorld> = {
  condition: StateCondition<Game>;
  body: ScriptAST<Game>;
  else?: ConditionElse<Game> | { body: ScriptAST<Game> };
};

export type UpdateState<
  Game extends GameWorld,
  ItemType extends StateObject = StateObject
> = {
  statementType: `UpdateGameObjectState`;
  objectType: ItemType;
  stateItem: keyof Game[`${ItemType}s`];
  newState: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["states"];
};

export type UpdateFlag<
  Game extends GameWorld,
  ItemType extends StateObject = StateObject
> = {
  statementType: `UpdateGameObjectFlag`;
  objectType: ItemType;
  stateItem: keyof Game[`${ItemType}s`];
  flag: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["flags"];
  value: boolean;
};

export type UpdateCounter<
  Game extends GameWorld,
  ItemType extends StateObject = StateObject
> = {
  statementType: "UpdateGameObjectCounter";
  objectType: ItemType;
  stateItem: keyof Game[`${ItemType}s`];
  name: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["counters"];
  transactionType: "set" | "increase" | "decrease";
  valueRangeStart: number;
  valueRangeEnd?: number;
};

export type SetStateText<
  Game extends GameWorld,
  ItemType extends StateObject = StateObject
> = {
  statementType: "SetGameObjectText";
  objectType: ItemType;
  stateItem: keyof Game[`${ItemType}s`];
  name: Game[`${ItemType}s`][keyof Game[`${ItemType}s`]]["texts"];
  text: string;
};

export type UpdateCharacterName<Game extends GameWorld> = {
  statementType: "UpdateCharacterName";
  translatable: boolean;
  character: keyof Game["characters"];
  newName: string | null;
};

export type CharacterSay<Game extends GameWorld> = {
  statementType: "CharacterSay";
  character: keyof Game["characters"];
  sentences: string[];
};

export type AddListItem<Game extends GameWorld> = {
  statementType: "AddListItem";
  list: keyof Game["lists"];
  unique: boolean;
  value: Game["lists"][keyof Game["lists"]];
};

export type RemoveListItem<Game extends GameWorld> = {
  statementType: "RemoveListItem";
  list: keyof Game["lists"];
  value: Game["lists"][keyof Game["lists"]];
};

export type DisplayList<Game extends GameWorld> = {
  statementType: "DisplayList";
  list: keyof Game["lists"];
  values: {
    [K in Game["lists"][keyof Game["lists"]]]?: ScriptAST<Game>;
  };
};
