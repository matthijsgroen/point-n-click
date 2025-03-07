import { useGameAction } from "@point-n-click/engine";

export const RenderText = () => {
  const { action, completeAction } = useGameAction();
  if (!action || action.type !== "text") {
    return null;
  }
  return (
    <div
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer absolute bottom-4 left-4 right-4"
      onClick={completeAction}
    >
      <p className="text-2xl">{action.text.join(" ")}</p>
    </div>
  );
};
