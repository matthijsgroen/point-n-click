import g from "../game";

g.defineOverlay("bakerConversation", {
  prompt: "What will you say:",
  onEnter: (w) => {
    if (!w.characters.baker.hasToldDaughter && w.characters.dragon.isToothPulled) {
      w.characters.baker.say(
        "People told me the dragon was slain. I heard the really loud roar.",
        `Did you see {b}${w.characters.daughter.name}{/b}? Is she still alive?`
      );
    } else {
      w.characters.player.say(
        "Hello, my name is {b}[.name]{/b}.",
        "I'm urgently looking for a medicine for the king.",
        "Could you help me?"
      );
      w.text("The baker does not respond and is staring in the distance.");
    }
  },
  onLeave: (w) => {
    if (w.state === "unknown") {
      w.text("You leave the baker alone and look around in the shop.");
    } else {
      w.text("You say goodbye and start browsing the shop.");
    }
  },

  interactions: (state, action) => {
    action("Hello, is everything alright?", state.state === "unknown", (w) => {
      w.text("The baker is staring in the distance.");
      w.characters.player.say("Hello? Are you alright?");
      w.characters.baker.say("Oh. Sorry, I was not paying attention.");
      w.text("The baker is startled. He was not aware you were in his shop.");
      w.characters.baker.say("Oh. Sorry, I was not paying attention.");
      w.text("The baker is startled. He was not aware you were in his shop.");
      w.characters.baker.say(
        "My {i}poor daughter!{/i} I will never see her again!",
        "That monsterous beast has her! I am sure of it!"
      );
      w.characters.baker.say(
        "I baked some {b}cookies{/b} this morning, but I'm out of flour now.",
        "And that is a problem, especially since the {b}mill{/b} broke down.",
        "And I need to make more money so that I can hire a {b}knight{/b},",
        "to slay that monster and save my daughter!"
      );
      w.state = "intro";
    });

    action(
      "Monster? What are you talking about?",
      state.state === "intro",
      (w) => {
        w.characters.player.say("Monster? What are you talking about?");
        w.characters.baker.say(
          "That ... beast ... in that tower ... in the woods."
        );
        w.text("The baker keeps sobbing.");
        w.characters.player.say(
          "Why do you think the 'monster' has your daughter?"
        );
        w.characters.baker.say(
          "My daughter is now missing for two days,",
          "and there is a {i}terrifying roar{/i} coming out of the dark woods for two days as well.",
          `It all started with that big fire at farmer {b}${w.characters.farmer.name}{/b}'s place.`,
          `That creature must have my sweet {b}${w.characters.daughter.name}{/b}...`
        );
        w.state = "visiting";
        if (w.characters.dragon.state === "unknown") {
          w.characters.dragon.state = "known";
        }
      }
    );

    action(
      `Yes, I've seen ${state.characters.daughter.name}.`,
      state.state === "visiting" &&
        state.characters.dragon.isToothPulled &&
        !state.characters.baker.hasToldDaughter,
      (w) => {
        w.characters.player.say(
          `Yes, I've seen ${w.characters.daughter.name}! She is alive and well.`,
          "I think she will be back here shortly."
        );
        w.characters.baker.say("Thank you! I cannot wait!");
        w.characters.baker.hasToldDaughter = true;
      }
    );

    action(
      "Could you tell me more about that monster?",
      state.state === "intro",
      (w) => {
        w.characters.player.say("Could you tell me more about that monster?");
        w.characters.baker.say(
          "That creature lives {b}east{/b} of here, in the {b}dark woods{/b}."
        );
        w.text("The baker has trouble not to start crying.");
        w.characters.baker.say(
          "My daughter is now missing for two days,",
          "and there is a {i}terrifying roar{/i} coming out of the dark woods for two days as well."
        );
        w.characters.baker.say(
          "We have to slay the beast! And save my daughter!",
          "You won't happen to have a {b}sword{/b} do you?",
          "You definitely would need a {b}sword{/b} to defend you against that monster."
        );
        if (w.items.sword.state === "unknown") {
          w.items.sword.state = "need";
        }
        w.characters.baker.hasToldDragon = true;
      }
    );

    action(
      "Do you know where I could get any medicine?",
      state.state === "visiting",
      (w) => {
        w.characters.player.say("Do you sell any medicine?");
        w.text("{b}[characters.baker.name]{/b} turns red.");
        w.characters.baker.say(
          "Uh, maybe... There is this lady see... uh...",
          "She lives in the {b}swamp{/b}. Lots of people are calling her a witch.",
          "She could definitely help you."
        );
        w.characters.baker.say(
          "Don't tell anyone, but if people come here for medicine I always get those from her.",
          "People don't dare to visit her. But she practically makes all medication for everyone here."
        );
        w.characters.baker.say(
          "Normally I would arrange it for you, but with the current situation with my daughter {b}[characters.daughter.name]{/b}..."
        );
        w.characters.baker.say(
          "... Let's say I'm avoiding her for the moment."
        );
        w.locations.swamp.canAccess = true;
      }
    );

    action(
      "Have you heard something about a treasure nearby?",
      state.state === "visiting" &&
        state.items.treasureNotes.state !== "unknown",
      (w) => {
        w.characters.player.say(
          "Have you heard something about a treasure nearby?"
        );
        w.characters.baker.say(
          "There are rumors.",
          "But I don't believe any of it. But what I heard was that there is a special plant in the {b}swamp{/b},",
          "that had some kind of {b}Moonstone{/b} hidden beneath it."
        );
        w.characters.baker.say(
          "And when it starts to glow, that you need to walk a special route.",
          "The plant is said to have {b}diamond-shaped leaves{/b}."
        );
        w.text("You find this very interesting, and make a note of it.");
        w.lists.inventory.addUnique("treasureNotes");
        w.items.treasureNotes.knowsMoonStone = true;
      }
    );

    action(
      "I brought you some grain",
      state.state === "visiting" &&
        state.characters.horse.state === "following" &&
        state.characters.horse.hasCart &&
        state.items.grain.state === "cart",
      (w) => {
        w.characters.player.say("I brought you some grain.");
        w.characters.baker.say(
          "Really? {i}Aww{/i}, with only grain I can't do much. Would you be able to {b}grind{/b} it to flour?"
        );
        w.text("The baker sighs and starts staring in the distance...");
      }
    );

    action(
      "I brought you some flour",
      state.state === "visiting" &&
        state.characters.horse.state === "following" &&
        state.characters.horse.hasCart &&
        state.items.grain.state === "flour",
      (w) => {
        w.characters.player.say("I brought you some flour.");
        w.characters.baker.say(
          "Really? Thank you! This wont bring back my {b}[characters.daughter.name]{/b}, but now at least I could bake something as a distraction."
        );
        w.text("The baker gives you 100 coins.");
        w.characters.player.coins += 100;
        w.lists.inventory.addUnique("coins");
        w.characters.player.say("That is way too much!");
        w.characters.baker.say(
          "Why? Money is of no use to me if I can't even save my own daughter?"
        );
        w.text("The baker sighs and starts staring in the distance...");
        w.items.grain.state = "delivered";
      }
    );
  },
});
