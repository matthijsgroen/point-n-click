import { RenderElement } from "@point-n-click/engine/src/dsl/displayObjects";
import headPeteDefault from "../../assets/doll_Piet/body.png";
import headSmile from "../../assets/doll_Piet/08.png";
import g from "../game";

g.defineDisplayObject("pete", {
  compose: ({ state }) => {
    const elements: RenderElement[] = [];

    if (state.body === "headPete") {
      elements.push({
        assetPath: headPeteDefault,
        offset: [0, 0],
      });
    }

    if (state.head === "smile") {
      elements.push({
        assetPath: headSmile,
        offset: [0, 0],
      });
    }

    return { size: [636, 800], elements };
  },

  defaultPose: () => ({
    state: { body: "headPete", head: "smile" },
  }),
});
