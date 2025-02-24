import { RenderElement } from "@point-n-click/engine/src/dsl/displayObjects";
import lawn from "../../assets/backgrounds/pietenhuis.jpg";
import g from "../game";

g.defineDisplayObject("background", {
  compose: ({ state }) => {
    const elements: RenderElement[] = [];
    if (state.image === "lawn") {
      elements.push({
        assetPath: lawn,
        offset: [0, 0],
      });
    }

    return { size: [1280, 720], elements };
  },

  defaultPose: () => ({
    state: { image: "home" },
  }),
});
