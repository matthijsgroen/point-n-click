import { PropsWithChildren, use } from "react";
import { Viewport } from "../components/Viewport";
import { GameStateContext } from "./GameStateProvider";

type Props = PropsWithChildren<{
  width: number;
  height: number;
  debug?: boolean;
}>;

export const GameViewport = ({
  width,
  height,

  children,
  debug = false,
}: Props) => {
  const { renderState } = use(GameStateContext);
  return (
    <Viewport
      width={width}
      height={height}
      renderState={renderState}
      debug={debug}
    >
      {children}
    </Viewport>
  );
};
