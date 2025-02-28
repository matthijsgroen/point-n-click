import { TextAction } from "@point-n-click/engine";

type Props = {
  action: TextAction;
  onComplete: VoidFunction;
};

export const RenderText = ({ action, onComplete }: Props) => {
  return (
    <div>
      <p>{action.text.join(" ")}</p>
    </div>
  );
};
