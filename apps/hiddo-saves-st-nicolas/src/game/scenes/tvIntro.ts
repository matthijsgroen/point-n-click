import g from "../game";

g.defineScene("tvIntro", (w) => {
  const { headPete, reporter } = w.characters;
  headPete.say("Hallo kinderen");
  headPete.say("We zijn weer in het land!");
  headPete.say("Maar helaas, niet alles gaat zoals we dat zouden willen.");
  headPete.say("Er is nog van alles wat we moeten regelen voor pakjesavond.");
  headPete.say("En ik weet niet of we {b}alles{/b} wel op tijd af krijgen...");
  reporter.say("Wat voor dingen moeten er dan nog geregeld worden?");
  headPete.say("Nou, van alles...");
  headPete.say("Maar ik weet wat!");
  headPete.say("Misschien kunnen de kinderen ons helpen!");
  headPete.say("Dan komt het vast wel goed!");
});
