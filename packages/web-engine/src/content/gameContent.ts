import { GameModel } from "@point-n-click/state";
import { GameWorld } from "@point-n-click/types";
import { atom } from "jotai";

export const gameContentAtom = atom<GameModel<GameWorld<number>> | null>(null);
