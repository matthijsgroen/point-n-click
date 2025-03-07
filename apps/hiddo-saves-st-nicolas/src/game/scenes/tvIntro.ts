import g from "../game";

g.defineScene("tvIntro", (w) => {
  const { lawn, pete, news } = w.setupScene((scene) => ({
    lawn: scene.get("lawn", 0, [0, 0]),
    pete: scene.get("pete", 1, [0.5, 0.2]),
    news: scene.get("newsOverlay", 2, [0, 0]),
  }));

  lawn.show("fade", 200);
  pete.show("fade", 200);
  news.show("fade", 200);

  const { headPete, reporter } = w.characters;
  headPete.say("Hallo kinderen");
  pete.pose({ head: "enthusiast" });
  headPete.say("We zijn weer in het land!");
  pete.pose({ head: "sad" });
  headPete.say("Maar helaas, niet alles gaat zoals we dat zouden willen.");
  headPete.say("Er is nog van alles wat we moeten regelen voor pakjesavond.");
  headPete.say("En ik weet niet of we {b}alles{/b} wel op tijd af krijgen...");
  reporter.say("Wat voor dingen moeten er dan nog geregeld worden?");
  headPete.say("Nou, van alles...");

  pete.pose({ head: "enthusiast", hasFingerUp: true });
  headPete.say("Maar ik weet wat!");
  headPete.say("Misschien kunnen de kinderen ons helpen!");
  headPete.say("Dan komt het vast wel goed!");
});
