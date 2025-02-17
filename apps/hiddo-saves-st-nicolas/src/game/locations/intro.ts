import g from "../game";

g.defineLocation("home", {
  describe: (w) => {
    const { player: hiddo, jinte } = w.characters;
    hiddo.say("Mam, het gaat beginnen!");
    jinte.say("Hoofdpiet is op de TV!");

    w.scenes.tvIntro.play();

    jinte.say("Mam! We moeten Sinterklaas helpen!");
    hiddo.say("Ze zoeken kinderen om te helpen voorbereiden voor pakjesavond!");
    hiddo.say("Onze.... {i}slik{/i} kadootjes staan op het spel!");

    w.locations.lawn.travel();
  },

  onLeaveToLawn: (w) => {
    // Describe text
    w.text("Je springt in de auto en je moeder rijd snel naar het Pietenhuis.");
  },
});
