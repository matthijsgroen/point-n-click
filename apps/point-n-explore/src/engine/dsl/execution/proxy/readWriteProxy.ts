import { produce } from "immer";
import { GameWorld, StateObject } from "../../types/world";
import { GameState, PartialObjectGroupState } from "../../syntax/state";
import { ScriptHelper } from "../../syntax/script";
import { Action } from "../actions";
import { customIfStatement } from "../customIfStatement";
import { isFlag } from "./isFlag";

export const stateItemProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  getState: () => GameState<Game>,
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void,
  itemType: ItemType,
  itemName: ItemName
) => ({
  get(
    target: {
      [key: string]: unknown;
    },
    prop: string | symbol,
    receiver: unknown
  ) {
    if (prop in target) {
      return Reflect.get(target, prop, receiver);
    }
    const itemState = getState()[`${itemType}s`]?.[itemName];
    if (isFlag(itemType, itemName, prop)) {
      if (!itemState) {
        return false;
      }
      return (
        (itemState as Record<string, boolean | undefined>)?.[prop as string] ??
        false
      );
    }
    if (prop === "state") {
      return itemState?.state ?? "unknown";
    }
    if (prop === "name") {
      if (itemState && "name" in itemState) {
        return itemState?.name;
      }
    }

    if (itemState) {
      return (
        (itemState as Record<string, number | undefined>)[prop as string] ?? 0
      );
    }
  },
  set(
    _target: { [key: string]: unknown },
    prop: string | symbol,
    value: string | number | boolean
  ) {
    if (String(prop) === "state") {
      updateState(
        produce((currentState) => {
          type ItemsState = PartialObjectGroupState<
            Game,
            ItemType,
            { name?: string; [key: string]: unknown }
          >;
          (currentState[`${itemType}s`] as ItemsState | undefined) ??=
            {} as ItemsState;

          (currentState[`${itemType}s`] as ItemsState)[itemName] ??= {};
          (currentState[`${itemType}s`] as ItemsState)[itemName].state =
            value as ItemsState[typeof itemName]["state"];
        })
      );
    }
    if (isFlag(itemType, itemName, prop) && typeof value === "boolean") {
      updateState(
        produce((currentState) => {
          type DraftState = Exclude<
            (typeof currentState)[`${ItemType}s`],
            undefined
          >;
          currentState[`${itemType}s`] ??= {} as DraftState;
          const flags = ((
            currentState[`${itemType}s`] as Record<
              string,
              Record<string, boolean>
            >
          )[itemName as string] ??= {});
          flags[prop] = value;
        })
      );
    }
    if (typeof value === "number") {
      updateState(
        produce((currentState) => {
          type ItemsState = PartialObjectGroupState<
            Game,
            ItemType,
            { name?: string; [key: string]: unknown }
          >;

          (currentState[`${itemType}s`] as ItemsState | undefined) ??=
            {} as ItemsState;

          (currentState[`${itemType}s`] as ItemsState)[itemName] ??= {};
          (
            (currentState[`${itemType}s`] as ItemsState)[itemName] as Record<
              string,
              number
            >
          )[String(prop)] = value;
        })
      );
    }

    // TODO: handle numbers
    return true;
  },
});

const characterHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
  actions: Action<Game>[],
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            say: (...text: string[]) => {
              actions.push({
                type: "say",
                character: String(prop),
                text,
              });
            },
          },
          stateItemProxy(getState, updateState, "character", String(prop))
        );
      },
    }
  ) as ScriptHelper<Game, "character", string>["characters"];

const locationHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
  actions: Action<Game>[],
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            travel: (text: string) => {
              actions.push({
                type: "say",
                character: String(prop),
                text: [text],
              });
            },
          },
          stateItemProxy(getState, updateState, "location", String(prop))
        );
      },
    }
  ) as ScriptHelper<Game, "location", string>["locations"];

const listHelper = <Game extends GameWorld>(
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
) =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return {
          addUnique: (item: string) => {
            updateState(
              produce((draft) => {
                type DraftLists = Exclude<(typeof draft)["lists"], undefined>;
                draft.lists ??= {} as DraftLists;
                const list = ((
                  draft.lists as unknown as Record<string, string[]>
                )[String(prop)] ??= []);
                if (!list.includes(item)) {
                  list.push(item);
                }
              })
            );
          },
        };
      },
    }
  ) as {
    [K in keyof Game["lists"]]: {
      addUnique: (item: Game["lists"][K]) => void;
    };
  };

const itemsHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
): ScriptHelper<Game, "item", string>["items"] =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {},
          stateItemProxy(getState, updateState, "item", String(prop))
        );
      },
    }
  ) as ScriptHelper<Game, "overlay", string>["overlays"];

const overlayHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
): ScriptHelper<Game, "overlay", string>["overlays"] =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return new Proxy(
          {
            open: () => {
              updateState(
                produce((draft) => {
                  draft.overlayStack ??= [];
                  (draft.overlayStack as string[]).push(String(prop));
                })
              );
            },
          },
          stateItemProxy(getState, updateState, "overlay", String(prop))
        );
      },
    }
  ) as ScriptHelper<Game, "overlay", string>["overlays"];

export const createReadWriteProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  getState: () => GameState<Game>,
  actions: Action<Game>[],
  applyPatch: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void,
  currentItemType: ItemType,
  currentItemName: ItemName
): ScriptHelper<Game, ItemType, ItemName> =>
  new Proxy(
    {
      characters: characterHelper<Game>(getState, actions, applyPatch),
      items: itemsHelper<Game>(getState, applyPatch),
      locations: locationHelper<Game>(getState, actions, applyPatch),
      overlays: overlayHelper<Game>(getState, applyPatch),
      lists: listHelper<Game>(applyPatch),
      text: (...text: string[]) => {
        actions.push({
          type: "text",
          text,
        });
      },
      if: customIfStatement,
      closeOverlay: () => {
        applyPatch(
          produce((draft) => {
            draft.overlayStack?.pop();
          })
        );
      },
    },
    stateItemProxy(getState, applyPatch, currentItemType, currentItemName)
  ) as ScriptHelper<Game, ItemType, ItemName>;
