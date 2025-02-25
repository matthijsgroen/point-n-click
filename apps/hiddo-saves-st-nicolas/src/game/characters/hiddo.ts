import g from "../game";
import normal from "../../assets/doll_Hiddo/body.png";
import smile from "../../assets/doll_Hiddo/01.png";
import shock from "../../assets/doll_Hiddo/02.png";
import { RenderElement } from "@point-n-click/engine/src/dsl/displayObjects";

g.defineDisplayObject("hiddo", {
  compose: ({ state, flags }) => {
    console.log(state, flags);

    const normalBody: RenderElement = {
      assetPath: normal,
      offset: [0, 0],
    };

    const normalHead: RenderElement = {
      assetPath: smile,
      offset: [0, 0],
    };

    const shockedHead: RenderElement = {
      assetPath: shock,
      offset: [0, 0],
    };
    type Heads = Exclude<typeof state, undefined>["head"];

    const heads: Record<Heads, RenderElement> = {
      happy: normalHead,
      thinking: normalHead,
      shocked: shockedHead,
    };

    return {
      size: [600, 800],
      elements: [normalBody, heads[state.head]],
    };
  },

  defaultPose: () => ({
    state: {
      body: "normal",
      head: "happy",
    },
  }),

  poseThinking: () => ({
    state: {
      head: "thinking",
      body: "thinking",
    },
  }),

  poseNormal: () => ({
    state: {
      body: "normal",
      head: "happy",
    },
  }),

  poseShocked: () => ({
    state: {
      body: "normal",
      head: "shocked",
    },
  }),
});
