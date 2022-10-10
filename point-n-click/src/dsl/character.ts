import { ScriptStatement } from "./ast-types";
import {
  ObjectStateDSL,
  objectStateManagement,
} from "./object-state-conditions";
import { GameWorld } from "./world-types";

export type CharacterDSL<
  Game extends GameWorld,
  I extends keyof Game["characters"]
> = {
  say: (...sentences: string[]) => void;
  setName: (newName: string) => void;
  setTranslatableName: (newName: string) => void;
  clearCustomName: () => void;
} & ObjectStateDSL<Game, "character", I>;

export type CharacterInterface<Game extends GameWorld> = {
  character: <I extends keyof Game["characters"]>(
    character: I
  ) => CharacterDSL<Game, I>;
};

export const characterDSLFunctions = <Game extends GameWorld>(
  addToActiveScript: (statement: ScriptStatement<Game>) => void
): CharacterInterface<Game> => ({
  character: <I extends keyof Game["characters"]>(
    character: I
  ): CharacterDSL<Game, I> => ({
    say: (...sentences) => {
      addToActiveScript({
        statementType: "CharacterSay",
        character,
        sentences,
      });
    },
    setName: (newName) => {
      addToActiveScript({
        statementType: "UpdateCharacterName",
        character,
        newName,
        translatable: false,
      });
    },
    setTranslatableName: (newName) => {
      addToActiveScript({
        statementType: "UpdateCharacterName",
        character,
        newName,
        translatable: true,
      });
    },
    clearCustomName: () => {
      addToActiveScript({
        statementType: "UpdateCharacterName",
        character,
        newName: null,
        translatable: false,
      });
    },
    ...objectStateManagement(addToActiveScript, "character", character),
  }),
});