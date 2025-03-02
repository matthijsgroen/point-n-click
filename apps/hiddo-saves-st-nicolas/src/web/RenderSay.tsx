import type { GameState, GameWorld, SayAction } from "@point-n-click/engine";
import { createReadOnlyProxy } from "@point-n-click/engine";

type Props<TGame extends GameWorld> = {
  action: SayAction<TGame>;
  state: GameState<TGame>;
  onComplete: VoidFunction;
};

export const RenderSay = <TGame extends GameWorld>({
  action,
  state,
  onComplete,
}: Props<TGame>) => {
  const proxy = createReadOnlyProxy(state);
  return (
    <div
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer"
      onClick={onComplete}
    >
      <h6 className="text-lg font-bold">
        {String(proxy.characters[action.character].name)}
      </h6>
      <p>{action.text.join(" ")}</p>
    </div>
  );
};
