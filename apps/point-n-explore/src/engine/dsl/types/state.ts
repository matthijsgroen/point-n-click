import { GameWorld, WorldObjectSettings } from "./world";

export type GameObjectState<State extends WorldObjectSettings> = {
    counters?: State["counters"] extends string ? {
        [key in State["counters"]]?: number;
    } : {};
    flags?: State["flags"] extends string ? {
        [key in State["flags"]]?: boolean;
    } : {};
    state?: State["states"] extends string ? State["states"] | "unknown" : "unknown";
    texts?: State["texts"] extends string ? {
        [key in State["texts"]]: string;
    } : {};
};

export type GameState<Game extends GameWorld> = {
    version: number;
    currentLocation?: keyof Game["locations"];
    previousLocation?: keyof Game["locations"];
    currentInteraction?: string;
    lastInteractionAt?: number;
    overlayStack: (keyof Game["overlays"])[];
    currentOverlay?: keyof Game["overlays"];
    currentScene?: Game["scenes"];
    settings: {
        cpm: number;
        skipMode: "tillChoice" | "screen" | "off";
    };
    items: {
        [K in keyof Game["items"]]?: GameObjectState<Game["items"][K]>;
    };
    characters: {
        [K in keyof Game["characters"]]: GameObjectState<Game["characters"][K]> & {
            name: string | null;
            defaultName: string;
        };
    };
    locations: {
        [K in keyof Game["locations"]]: GameObjectState<Game["locations"][K]>;
    };
    overlays: {
        [K in keyof Game["overlays"]]: GameObjectState<Game["overlays"][K]>;
    };
    lists: {
        [K in keyof Game["lists"]]?: Game["lists"][K][];
    };
    inputs: Record<string, unknown>;
};