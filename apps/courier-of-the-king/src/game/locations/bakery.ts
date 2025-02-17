import g from "../game";

g.defineLocation("bakery", {
  describe: (w) => {
    w.if(w.characters.daughter.state === "bakery", () => {
      w.text(
        `You are in the bakery. {b}${w.characters.baker.name}{/b}, the baker, looks incredibly happy.`,
        "A smell of freshly baked bread and pies hangs in the air.",
        `The daughter of the baker, {b}${w.characters.daughter.name}{/b}, is also here.`
      );

      w.characters.baker.say(
        "Thank you so much for killing the dragon and saving my daughter!",
        "I thought I would never see her again!"
      );
      w.text("{b}[characters.daughter.name]{/b} gives you a wink.");
    }).else(() => {
      w.text(
        "You are in the bakery. It is surprisingly empty.",
        "No cakes, pies or bread."
      );
      w.text("The only thing for sale seem to be {b}cookies{/b}.");

      w.if(
        w.characters.dragon.isToothPulled &&
          !w.characters.baker.hasToldDaughter,
        () => {
          w.overlays.bakerConversation.open();
        }
      )
        .else(w.locations.bakery.hasVisited, () => {
          w.text("The baker looks really sad.");
        })
        .else(() => {
          w.text(
            "You somehow expected to be greeted by the baker, but no luck.",
            "The baker looks really sad."
          );
          w.locations.bakery.hasVisited = true;
        });
    });
  },

  onEnterFromVillage: (w) => {
    w.if(w.characters.horse.state !== "following", () => {
      w.text("A nice smell of bread and cakes comes from the bakery.");
      w.text("You step into the shop with a mouth watering.");
    });
  },

  onLeaveToVillage: (w) => {
    w.if(w.characters.daughter.state === "bakery", () => {
      w.text("You you walk back outside.");
    }).else(() => {
      w.text(
        "You have no idea how to deal with the situation, so you walk back outside."
      );
    });
    w.if(w.characters.horse.state === "following", () => {
      w.text(`You untie {b}${w.characters.horse.name}{/b}.`);
    });
  },

  interactions: (s) => {
    s.addAction({
      label: "Talk to baker",
      enabled: true,
      action: (w) => {
        w.overlays.bakerConversation.open();
      },
    });

    s.addAction({
      label: "Leave bakery",
      enabled: true,
      action: (w) => {
        w.locations.village.travel();
      },
    });
  },
});
