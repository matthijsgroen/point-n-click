import g from "../game";
import normal from "../../assets/doll_Hiddo/body.png";
// import { RenderElement } from "@point-n-click/engine/src/plugins/DisplayObjects";

g.defineDisplayObject("hiddo", {
  compose: ({ state, flags }) => {
    console.log(state, flags);
    return {
      size: [600, 800],
      elements: [{ assetPath: normal, offsetX: 0, offsetY: 0 }],
    };
  },

  poseThinking: {
    state: {
      head: "thinking",
      body: "thinking",
    },
  },

  poseNormal: {
    state: {
      body: "normal",
      head: "happy",
    },
  },
});
