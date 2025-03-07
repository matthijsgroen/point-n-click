import g from "../game";

g.defineLocation("lawn", {
  onEnterFromHome: (w) => {
    const { background } = w.setupScene((scene) => ({
      background: scene.get("lawn", 0, [0, 0]),
    }));
    background.show("fade", 200);
    w.text("Met piepende banden komen jullie aangereden.");
  },

  describe: (w) => {
    const { hiddo } = w.setupScene((scene) => ({
      hiddo: scene.get("hiddo", 1, [0.5, 0]),
    }));
    hiddo.show("instant");

    w.text("You are standing on the lawn.");
    w.text("It is a beautiful day.");
    w.text("The sun is shining.");
    w.text("The birds are singing.");
    w.text("The grass is green.");
  },

  interactions: (w) => {
    w.addAction({
      label: "Kijk eens rond",
      enabled: true,
      action: (w) => {
        w.text("Je kijkt eens rond.");
      },
    });
  },
});
