import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./web/App.tsx";
import { game } from "./game/index.ts";

import { GameState, GameSettings } from "./game/stateModelV1.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App<GameState, GameSettings, typeof game> game={game} />
  </StrictMode>
);
