import g from "../game";

g.defineLocation("village", {
  describe: (w) => {
    w.if(w.characters.dragon.isToothPulled, () => {
      w.text(
        "You are in the village. Where is was eery and quiet before, everything is now in a {b}festive{/b} atmosphere."
      );
      // w.descriptionText("");
      w.text("Flags, banners and garlands are hanging everywhere.");
      // w.descriptionText("");
      w.text("A villager you've never seen before comes to you.");
      w.characters.villager.say(
        `Hurray for {b}[${w.characters.player.name}]{/b}! The dragonslayer!`,
        "We all heard the last outcry, you are a {b}hero{/b}!"
      );
    }).else(() => {
      w.text("You are in the village. It is eery quiet.");
      // w.descriptionText("");
    });

    w.text(
      "At the left side of the road is is a {b}bakery{/b}.",
      "At the right side of the road a large {b}smithy{/b}."
    );
    // w.descriptionText("");

    w.text(
      "The road continues {b}southwards{/b}, to a {b}river{/b}.",
      "A small hidden path goes {b}eastwards{/b}, to a {b}dark wood{/b}."
    );
  },

  onLeaveToFarmland: (w) => {
    w.if(w.characters.horse.state === "following", () => {
      w.text(
        `Together with [${w.characters.horse.name}], you walk northwards, to the farmlands.`
      );
    }).else(() => {
      w.text("You walk northwards, to the farmlands.");
    });
  },

  onLeaveToDarkwoods: (w) => {
    w.if(w.characters.horse.state === "following", () => {
      w.text(
        `Together with [${w.characters.horse.name}], you walk over a small twisting path, towards the dark woods.`
      );
    }).else(() => {
      w.text("You walk over a small twisting path, towards the dark woods.");
    });
  },

  onLeaveToRiver: (w) => {
    w.if(w.characters.horse.state === "following", () => {
      w.text(
        `Together with [${w.characters.horse.name}] you walk towards the river.`
      );
    }).else(() => {
      w.text("You walk southwards, towards the river.");
    });
  },

  onLeaveToBakery: (w) => {
    w.if(w.characters.horse.state === "following", () => {
      w.text(
        `You tie up [${w.characters.horse.name}] to the store. You enter the store with your mouth watering.`
      );
    });
  },

  onLeaveToSmithy: (w) => {
    w.if(w.characters.horse.state === "following", () => {
      w.text(
        `You tie up [${w.characters.horse.name}] to a pole near the smithy and enter.`
      );
    }).else(() => {
      w.text("You enter the large smithy.");
    });
  },

  interactions: (s) => {
    s.addAction({
      label: "Go to bakery",
      enabled: true,
      action: (w) => {
        w.locations.bakery.travel();
      },
    });

    s.addAction({
      label: "Go to smithy",
      enabled: true,
      action: (w) => {
        w.locations.smithy.travel();
      },
    });

    s.addAction({
      label: "Go north, to the farmlands",
      enabled: true,
      action: (w) => {
        w.locations.farmland.travel();
      },
      // shortcutKey: "n"
    });

    s.addAction({
      label: "Go east, to the dark woods",
      enabled: true,
      action: (w) => {
        w.locations.darkwoods.travel();
      },
      // shortcutKey: "e"
    });

    s.addAction({
      label: "Go south, to the river",
      enabled: true,
      action: (w) => {
        w.locations.river.travel();
      },
      // shortcutKey: "s"
    });
  },
});
