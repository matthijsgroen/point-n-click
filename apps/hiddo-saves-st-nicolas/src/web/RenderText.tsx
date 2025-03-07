import type { TextAction } from "@point-n-click/engine";

type Props = {
  action: TextAction;
  onComplete: VoidFunction;
};

export const RenderText = ({ action, onComplete }: Props) => {
  return (
    <div
      className="bg-black/50 py-4 px-8 rounded-md text-white select-none cursor-pointer absolute bottom-4 left-4 right-4"
      onClick={onComplete}
    >
      <p className="text-2xl">{action.text.join(" ")}</p>
    </div>
  );
};
