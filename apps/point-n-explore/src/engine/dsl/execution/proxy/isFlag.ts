import { GameWorld, StateObject } from "../../types/world";

export const isFlag = <
  Game extends GameWorld,
  ItemType extends StateObject,
  ItemName extends keyof Game[`${ItemType}s`]
>(
  _itemType: ItemType,
  _itemName: ItemName,
  prop: unknown
): prop is Game[`${ItemType}s`][ItemName]["flags"] & string =>
  String(prop).startsWith("is") ||
  String(prop).startsWith("has") ||
  String(prop).startsWith("can") ||
  String(prop).startsWith("knows");
