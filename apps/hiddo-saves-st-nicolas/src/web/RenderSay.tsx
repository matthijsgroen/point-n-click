import { GameData, GameWorld, SayAction } from "@point-n-click/engine";

type Props<TGame extends GameWorld> = {
  action: SayAction<TGame>;
  data: GameData<TGame>;
  onComplete: VoidFunction;
};

export const RenderSay = <TGame extends GameWorld>({
  action,
  data,
  onComplete,
}: Props<TGame>) => {
  return (
    <div
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer"
      onClick={onComplete}
    >
      <h6 className="text-lg font-bold">
        {String(data.settings.initialState.characters[action.character].name)}
      </h6>
      <p>{action.text.join(" ")}</p>
    </div>
  );
};
