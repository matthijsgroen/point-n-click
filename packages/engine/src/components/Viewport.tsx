import { RenderObject } from "../dsl/displayObjects";

type Props = {
  width: number;
  height: number;
  renderState: Record<string, RenderObject>;
};

export const Viewport = ({ width, height, renderState }: Props) => {
  const imagesToRender = Object.entries(renderState).flatMap(
    ([object, info]) => {
      console.log("object", object, info, renderState);
      return info.elements;
    }
  );

  return (
    <>
      <div className="bg-black w-full aspect-video text-gray-200 relative">
        {imagesToRender.map((element, index) => (
          <img
            key={index}
            src={element.assetPath}
            alt={""}
            className="object-contain absolute"
          />
        ))}
      </div>
      <p className="font-mono text-xs text-gray-500">
        {JSON.stringify(renderState)}
      </p>
    </>
  );
};
