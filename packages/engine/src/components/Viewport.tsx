import { RenderObject } from "../dsl/displayObjects";
import { GameWorld } from "../main";

type Props = {
  width: number;
  height: number;
  renderState: Record<string, RenderObject>;
};

export const Viewport = ({ width, height, renderState }: Props) => {
  const imagesToRender = Object.entries(renderState).map(([object, info]) => {
    console.log("object", object, info, renderState);
    return info.elements;
  });

  return (
    <div className="bg-black w-full aspect-video text-gray-200">
      {JSON.stringify(renderState)}
    </div>
  );
};
