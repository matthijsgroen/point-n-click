import { useGameAction, useGameState } from "@point-n-click/engine";

export const RenderSay = () => {
  const { action, completeAction } = useGameAction();
  const state = useGameState();

  if (!action || action.type !== "say") {
    return null;
  }

  return (
    <div
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer absolute bottom-4 left-4 right-4"
      onClick={completeAction}
    >
      <h6 className="text-2xl mb-3 font-bold">
        {String(state.characters[action.character].name)}
      </h6>
      <p className="text-2xl">{action.text.join(" ")}</p>
    </div>
  );
};
