import { PropsWithChildren, use, useEffect, useRef, useState } from "react";
import { PositionedRenderObject } from "../dsl/displayObjects";

type Props = PropsWithChildren<{
  width: number;
  height: number;
  debug: boolean;
  renderState: PositionedRenderObject[];
}>;

export const Viewport = ({
  width,
  height,
  renderState,
  children,
  debug,
}: Props) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (frameRef.current && sceneRef.current) {
      const frame = frameRef.current;
      const scene = sceneRef.current;

      const resizeListener = () => {
        const scale = Math.min(
          frame.clientWidth / width,
          frame.clientHeight / height
        );
        scene.style.scale = String(scale);
      };
      const observer = new ResizeObserver(resizeListener);
      observer.observe(frame);

      return () => {
        observer.unobserve(frame);
      };
    }
  }, [frameRef.current]);

  return (
    <>
      <div
        className="bg-black w-full aspect-video overflow-hidden relative"
        ref={frameRef}
      >
        <div
          className="relative origin-top-left overflow-hidden"
          ref={sceneRef}
          style={{
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          {renderState.map((item, index) => (
            <div
              key={index}
              className="relative"
              style={{
                left: item.position[0] * width,
                top: item.position[1] * height,
              }}
            >
              {item.elements.map((element, index) => (
                <img
                  key={index}
                  src={element.assetPath}
                  className="absolute origin-top-left"
                  alt={""}
                  style={{
                    scale: item.scale ?? 1,
                  }}
                />
              ))}
            </div>
          ))}
          {children}
        </div>
      </div>
      {debug && (
        <p className="font-mono text-xs text-gray-500">
          {JSON.stringify(renderState)}
        </p>
      )}
    </>
  );
};
