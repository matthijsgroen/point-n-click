import { GameState } from "./state";
import { RecursivePartial } from "./utils";
import { GameWorld } from "./world";

export type Settings<Game extends GameWorld> = {
    /**
     * The title of your game. Displayed on the title screen
     * and as title of the webpage / browser tab.
     */
    gameTitle: string;
    subTitle?: string;
    meta?: {
        author?: string;
        description?: string;
    };
    initialState: RecursivePartial<GameState<Game>> & {
        version: Game["version"];
    };
    defaultActionPrompt?: string;
    characterConfigs: Record<keyof Game["characters"], {
        defaultName: string;
    }>;
};