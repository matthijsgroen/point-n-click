import g from "../game";

g.defineOverlay("tvIntro", {
  onEnter: (w) => {
    const { headPete } = w.characters;
    headPete.say("Hallo kinderen");
  },
});
