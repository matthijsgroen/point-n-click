import { RenderElement } from "@point-n-click/engine/src/dsl/displayObjects";
import lawn from "../../assets/backgrounds/pietenhuis.jpg";
import home from "../../assets/backgrounds/living-room.jpg";
import kids from "../../assets/backgrounds/living-room-kids.png";
import tv from "../../assets/backgrounds/living-room-tv.png";
import g from "../game";

g.defineDisplayObject("background", {
  compose: ({ state }) => {
    const elements: RenderElement[] = [];
    if (state?.image === "lawn") {
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

g.defineDisplayObject("home", {
  compose: ({ flags }) => {
    const elements: RenderElement[] = [];
    elements.push({
      assetPath: home,
      offset: [0, 0],
    });

    if (flags?.isTVOn) {
      elements.push({
        assetPath: tv,
        offset: [0, 0],
      });
    }

    if (flags?.hasKidsOnCouch) {
      elements.push({
        assetPath: kids,
        offset: [0, 0],
      });
    }

    return { size: [1280, 720], elements };
  },

  defaultPose: () => ({
    state: { image: "home" },
    flags: { hasKidsOnCouch: false, isTVOn: false },
  }),
});
