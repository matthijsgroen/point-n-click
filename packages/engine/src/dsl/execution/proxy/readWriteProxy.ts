import { produce } from "immer";
import type { GameWorld, StateObject } from "../../types/world";
import type { GameState, PartialObjectGroupState } from "../../syntax/state";
import type { ObjectScriptHelper, ScenesHelper } from "../../syntax/script";
import type { Action } from "../actions";
import { customIfStatement } from "../customIfStatement";
import { isFlag } from "./isFlag";
import type { GameData } from "../../syntax/dsl";
import { setupSceneHelper } from "../setupScene";

export type SystemInternalInterface<Game extends GameWorld> = {
  addAction: (action: Action<Game>) => void;
};

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
  addAction: (action: Action<Game>) => void,
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
              addAction({
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
  ) as ObjectScriptHelper<Game, "character", string>["characters"];

const locationHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
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
            travel: () => {
              updateState(
                produce((draft) => {
                  (draft.currentLocation as string) = String(prop);
                  draft.overlayStack = [];
                })
              );
            },
          },
          stateItemProxy(getState, updateState, "location", String(prop))
        );
      },
    }
  ) as ObjectScriptHelper<Game, "location", string>["locations"];

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
): ObjectScriptHelper<Game, "item", string>["items"] =>
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
  ) as ObjectScriptHelper<Game, "overlay", string>["overlays"];

const overlayHelper = <Game extends GameWorld>(
  getState: () => GameState<Game>,
  updateState: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void
): ObjectScriptHelper<Game, "overlay", string>["overlays"] =>
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
  ) as ObjectScriptHelper<Game, "overlay", string>["overlays"];

const sceneHelper = <Game extends GameWorld>(
  addAction: (action: Action<Game>) => void
): ScenesHelper<Game, { play: VoidFunction }> =>
  new Proxy(
    {},
    {
      get(_target, prop) {
        return {
          play: () => {
            addAction({
              type: "scene",
              scene: String(prop),
            });
          },
        };
      },
    }
  ) as ScenesHelper<Game, { play: VoidFunction }>;

export const createReadWriteProxy = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  getState: () => GameState<Game>,
  addAction: (action: Action<Game>) => void,
  applyPatch: (
    patch: (currentState: GameState<Game>) => GameState<Game>
  ) => void,
  content: GameData<Game>,
  currentItemType?: ItemType,
  currentItemName?: ItemName
): ObjectScriptHelper<Game, ItemType, ItemName> => {
  const baseObject = {
    characters: characterHelper<Game>(getState, addAction, applyPatch),
    items: itemsHelper<Game>(getState, applyPatch),
    locations: locationHelper<Game>(getState, applyPatch),
    overlays: overlayHelper<Game>(getState, applyPatch),
    scenes: sceneHelper<Game>(addAction),
    lists: listHelper<Game>(applyPatch),
    text: (...text: string[]) => {
      addAction({
        type: "text",
        text,
      });
    },
    if: customIfStatement,
    setupScene: setupSceneHelper<Game>(
      getState,
      addAction,
      applyPatch,
      content
    ),
    closeOverlay: () => {
      applyPatch(
        produce((draft) => {
          draft.overlayStack?.pop();
        })
      );
    },
  };

  if (currentItemType === undefined || currentItemName === undefined) {
    return baseObject as unknown as ObjectScriptHelper<
      Game,
      ItemType,
      ItemName
    >;
  }

  return new Proxy(
    baseObject,
    stateItemProxy(getState, applyPatch, currentItemType, currentItemName)
  ) as ObjectScriptHelper<Game, ItemType, ItemName>;
};
