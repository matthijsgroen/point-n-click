import g from "../game";

g.defineLocation("lawn", {
  onEnterFromHome: (w) => {
    w.text("Met piepende banden komen jullie aangereden.");
  },

  describe: (w) => {
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
