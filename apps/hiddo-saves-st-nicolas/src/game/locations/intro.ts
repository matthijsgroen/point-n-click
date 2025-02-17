import g from "../game";

g.defineLocation("home", {
  describe: (w) => {
    const { player, jinte } = w.characters;
    player.say("Mam, het gaat beginnen!");
    jinte.say("Hoofdpiet is op de TV!");

    w.overlays.tvIntro.open();
  },
});
