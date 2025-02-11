/* eslint-disable @typescript-eslint/no-empty-object-type */
import { GameDefinition } from "../engine/dsl/types/world";

export type GameState = GameDefinition<
  1,
  {
    version: 1;
    locations: {
      home: { states: "home" };
      forest: { flags: "hasVisited" };
      farmland: { flags: "hasVisited" };
      farm: { flags: "hasVisited" };
      hills: { flags: "hasVisited" };
      mine: { flags: "hasVisited" };
      mill: { flags: "hasVisited"; states: "isFixed" };
      swamp: { flags: "canAccess" };
      cabin: { flags: "hasVisited"; states: "accessible" };
      cabinInside: { flags: "hasVisited" };
      village: { flags: "hasVisited" };
      bakery: { flags: "hasVisited" };
      smithy: { flags: "hasVisited"; states: "browsing" };
      darkwoods: { flags: "hasVisited" };
      tower: {
        flags: "hasVisited";
        states: "firstVisit" | "inside" | "visited";
      };
      towerTop: { flags: "hasVisited"; states: "sneakIn" };
      towerTopElevator: {};
      towerBaseElevator: { flags: "isCellarDoorOpen" };
      river: { flags: "hasVisited" };
      treasureRoute: { counters: "steps" };
      cellar: {};
    };
    items: {
      testDice: { counters: "dice1" | "dice2" | "dice3" };
      elevator: { states: "down" | "broken" };
      bag: { states: "known" | "possession" };
      branch: { states: "possession" | "used" };
      pickaxe: { states: "broken" | "fixed" | "given" };
      rope: {
        states: "possession" | "tying" | "cut";
        flags: "isTiedElevator" | "isTiedTooth";
      };
      millstone: { states: "seen" | "cart" | "elevator" | "used" | "rope" };
      grain: { states: "access" | "cart" | "flour" | "delivered" };
      fabric: { states: "possession" | "used" };
      medicine: { flags: "hasRecipe" };
      cookies: { states: "price" | "possession" | "given" };
      gemstone: { states: "chopped" | "possession" | "used" };
      sword: { states: "need" | "possession" };
      necklace: { states: "need" | "possession" | "given" };
      treasureNotes: {
        states: "existence" | "possession";
        flags: "knowsMoonStone" | "knowsRoute" | "knowsStartPoint";
      };
      ingredientList: {
        states: "possession";
        flags:
          | "hasSeen"
          | "hasRoundLeaves"
          | "hasThornyLeaves"
          | "hasTooth"
          | "hasToadstools";
      };
      treasureHunt: { flags: "isActive" | "isDone" };
      moonStone: { states: "possession" };
      gold: { states: "possession" | "used" };
      runeStone: { states: "possession"; flags: "knowsUsage" };
      plants: { counters: "roundLeaves" | "thornyLeaves" | "heartLeaves" };
      mushrooms: { counters: "lightblue" | "brown" | "orange" };
      moss: { counters: "starmoss" | "cosmoss" | "moonmoss" };

      tooth: { states: "pulled" | "possession" | "cauldron" | "workbench" };
      saddle: { states: "possession" | "placed" };
      beaker: { states: "possession" | "wine" };
    };
    characters: {
      player: {
        counters: "coins";
        flags:
          | "isMale"
          | "hasHerbKnowledge"
          | "hasFungiKnowledge"
          | "hasMossKnowledge";
      };
      dwarf: { flags: "isNameKnown"; states: "happy" };
      miller: {};
      horse: {
        states: "river" | "following" | "stable";
        flags: "hasHoovesFixed" | "hasCart" | "isFound" | "isKnown";
      };
      dragon: { states: "known" | "found"; flags: "isToothPulled" | "canTalk" };
      farmer: { flags: "isVisited" | "hasToldDragon" | "hasReturnedHorse" };
      daughter: { states: "unloadStone" | "bakery" };
      witch: {};
      baker: { flags: "hasToldDragon" | "hasToldDaughter" };
      farrier: {};
      goldsmith: {};
      armorer: {};
      villager: {};
    };
    overlays: {
      dwarfConversation: {};
      millerConversation: {};
      farmerConversation: {};
      bakerConversation: {
        states: "buyCookies" | "intro" | "visiting";
      };
      smithsConversation: { states: "fixHorseshoe" | "createNecklace" };
      witchConversation: {
        states: "intro" | "visited" | "brewing";
        counters: "brewStep";
      };
      daughterConversation: { states: "intro" | "visited" };
      dragonConversation: {};
      inventory: {};
      travel: {};
      treasureNotes: {};
      ingredientList: {};

      plants: {};
      mushrooms: {};
      moss: {};

      books: {};
      ingredientBook: { counters: "page" };
      recipeBook: { counters: "page"; flags: "isOpen" };
      cauldron: {
        states:
          | "addIngredient"
          | "saySpell"
          | "saySimSala"
          | "sayHocus"
          | "sayAbra";
        flags:
          | "hasIngredients"
          | "hasMoonstone"
          | "hasDragonTooth"
          | "hasRunestone";
        counters:
          | "roundLeaves"
          | "thornyLeaves"
          | "heartLeaves"
          | "starmoss"
          | "moonmoss"
          | "cosmoss"
          | "lightBlueMushrooms"
          | "lightBrownFungi"
          | "orangeFungi"
          | "failureOutcome"
          | "addIngredientEffect"
          | "spellPart2";
      };

      gameIntro: { states: "name" };
    };
    lists: {
      inventory:
        | "branch"
        | "rope"
        | "gem"
        | "gold"
        | "necklace"
        | "coins"
        | "cookies"
        | "runeStone"
        | "moonStone"
        | "fabric"
        | "treasureNotes"
        | "ingredientList"
        | "brokenPickaxe"
        | "thornyLeaves"
        | "roundLeaves"
        | "heartLeaves"
        | "lightblueMushrooms"
        | "lightBrownFungi"
        | "orangeFungi"
        | "sword"
        | "repairedPickaxe"
        | "dragonTooth"
        | "starmoss"
        | "moonmoss"
        | "cosmoss"
        | "doorSticksPotion"
        | "saddle"
        | "beaker";
    };
    scenes: "cauldronResult" | "cauldronEffect";
  }
>;
