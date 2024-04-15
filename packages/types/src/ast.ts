import {
  GameObjectFlagCondition,
  GameObjectStateCondition,
  StateCondition,
} from "./conditions";
import { ContentPluginStatement } from "./contentPlugin";
import { StateObject } from "./state";
import { GameWorld } from "./world";

export type Script = () => void;

export type LocationScript<
  Game extends GameWorld,
  Location extends keyof Game["locations"]
> = (events: {
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
  hasState: (
    state: Game["locations"][Location]["states"] | "unknown"
  ) => GameObjectStateCondition<Game, "location">;
  setState: (
    newState: Game["locations"][Location]["states"] | "unknown"
  ) => void;
  hasFlag: (
    flag: Game["locations"][Location]["flags"]
  ) => GameObjectFlagCondition<Game, "location">;
  setPrompt: (
    interactionPrompt: string,
    condition?: StateCondition<Game>
  ) => void;
}) => void;

export type OverlayScript<
  Game extends GameWorld,
  Overlay extends keyof Game["overlays"]
> = (events: {
  onEnter: (script: Script) => void;
  onLeave: (script: Script) => void;
  interaction: Interaction<Game>;
  closeOverlay: () => void;
  hasState: (
    state: Game["overlays"][Overlay]["states"] | "unknown"
  ) => GameObjectStateCondition<Game, "overlay">;
  setState: (newState: Game["overlays"][Overlay]["states"] | "unknown") => void;
  setPrompt: (
    interactionPrompt: string,
    condition?: StateCondition<Game>
  ) => void;
}) => void;

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

export type Interaction<Game extends GameWorld> = (
  text: string,
  condition: StateCondition<Game>,
  script: Script
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
  prompts: { prompt: string; condition: StateCondition<Game> }[];
};
export type GameOverlay<Game extends GameWorld> = {
  id: keyof Game["overlays"];
  onEnter: { script: ScriptAST<Game> };
  onLeave: { script: ScriptAST<Game> };
  interactions: GameInteraction<Game>[];
  prompts: { prompt: string; condition?: StateCondition<Game> }[];
};
export type ScriptAST<Game extends GameWorld> = (
  | ScriptStatement<Game>
  | ContentPluginStatement
)[];

export type ScriptStatement<Game extends GameWorld> =
  | TextStatement
  | DescribeLocationStatement
  | TravelStatement<Game>
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
