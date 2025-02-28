import { GameWorld, SayAction } from "@point-n-click/engine";

type Props<TGame extends GameWorld> = {
  action: SayAction<TGame>;
  onComplete: VoidFunction;
};

export const RenderSay = <TGame extends GameWorld>({
  action,
  onComplete,
}: Props<TGame>) => {
  return (
    <div
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer"
      onClick={onComplete}
    >
      <p>{action.text.join(" ")}</p>
    </div>
  );
};
