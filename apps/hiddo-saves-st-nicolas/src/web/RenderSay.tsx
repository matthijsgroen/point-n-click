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
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer absolute bottom-4 left-4 right-4"
      onClick={onComplete}
    >
      <h6 className="text-2xl mb-3 font-bold">
        {String(proxy.characters[action.character].name)}
      </h6>
      <p className="text-2xl">{action.text.join(" ")}</p>
    </div>
  );
};
