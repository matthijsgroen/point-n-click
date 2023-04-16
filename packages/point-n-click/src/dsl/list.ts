import {
  DisplayList,
  GameWorld,
  ListItemCondition,
  Script,
  ScriptAST,
  ScriptStatement,
} from "@point-n-click/types";

export type ListDSL<Game extends GameWorld, L extends keyof Game["lists"]> = {
  display: (
    itemDisplayScript: (params: {
      onItem: <I extends Game["lists"][L]>(item: I, script: Script) => void;
    }) => void
  ) => void;
  /**
   * Adds an item to the end of the list
   */
  add: <I extends Game["lists"][L]>(item: I) => void;
  /**
   * Only add item if it was not yet in the list
   */
  addUnique: <I extends Game["lists"][L]>(item: I) => void;
  /**
   * Removes an item from the list
   */
  remove: <I extends Game["lists"][L]>(item: I) => void;
  isInList: <I extends Game["lists"][L]>(item: I) => ListItemCondition<Game>;
};

export type ListInterface<Game extends GameWorld> = {
  list: <L extends keyof Game["lists"]>(list: L) => ListDSL<Game, L>;
};

export const listDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void,
  wrapScript: (execution: Script) => ScriptAST<Game>
): ListInterface<Game> => ({
  list: <L extends keyof Game["lists"]>(list: L) => ({
    display: (item) => {
      const statement: DisplayList<Game> = {
        statementType: "DisplayList",
        list,
        values: {},
      };

      const onItem: Parameters<typeof item>[0]["onItem"] = (item, script) => {
        statement.values[item] = wrapScript(script);
      };

      item({ onItem });
      addToActiveScript(statement);
    },
    add: (item) => {
      addToActiveScript({
        statementType: "AddListItem",
        list,
        unique: false,
        value: item,
      });
    },
    addUnique: (item) => {
      addToActiveScript({
        statementType: "AddListItem",
        list,
        unique: true,
        value: item,
      });
    },
    remove: (item) => {
      addToActiveScript({
        statementType: "RemoveListItem",
        list,
        value: item,
      });
    },
    isInList: (item): ListItemCondition<Game> => ({
      op: "IsInList",
      list,
      item,
    }),
  }),
});
