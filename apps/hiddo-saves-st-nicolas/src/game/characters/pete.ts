import { RenderElement } from "@point-n-click/engine/src/dsl/displayObjects";
import headPeteDefault from "../../assets/doll_Piet/body.png";
import headPeteFingerUp from "../../assets/doll_Piet/body-point-up.png";
import headSmile from "../../assets/doll_Piet/08.png";
import headEnthusiast from "../../assets/doll_Piet/01.png";
import headSad from "../../assets/doll_Piet/02.png";
import g from "../game";

g.defineDisplayObject("pete", {
  compose: ({ state, flags }) => {
    const elements: RenderElement[] = [];

    if (state.body === "headPete") {
      let headPeteBody = headPeteDefault;
      if (flags?.hasFingerUp) {
        headPeteBody = headPeteFingerUp;
      }
      elements.push({
        assetPath: headPeteBody,
        offset: [0, 0],
      });
    }

    if (state.head === "smile") {
      elements.push({
        assetPath: headSmile,
        offset: [0, 0],
      });
    }
    if (state.head === "enthusiast") {
      elements.push({
        assetPath: headEnthusiast,
        offset: [0, 0],
      });
    }

    if (state.head === "sad") {
      elements.push({
        assetPath: headSad,
        offset: [0, 0],
      });
    }

    return { size: [636, 800], elements };
  },

  defaultPose: () => ({
    state: { body: "headPete", head: "smile" },
  }),

  poseEnthusiast: () => ({
    state: { head: "enthusiast" },
  }),

  poseSad: () => ({
    state: { head: "sad" },
  }),

  poseIdea: () => ({
    state: { head: "enthusiast" },
    flags: { hasFingerUp: true },
  }),
});
