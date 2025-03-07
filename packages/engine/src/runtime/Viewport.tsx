import { PropsWithChildren, use } from "react";
import { Viewport } from "../components/Viewport";
import { GameContext } from "./context";

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
  const { renderState } = use(GameContext);
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
