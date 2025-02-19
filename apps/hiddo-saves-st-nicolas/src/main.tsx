import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./web/App.tsx";
import { game, plugins } from "./game/index.ts";

import { GameSettings, GameState } from "./game/stateModelV1.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App<GameState, GameSettings, typeof plugins, typeof game> game={game} />
  </StrictMode>
);
