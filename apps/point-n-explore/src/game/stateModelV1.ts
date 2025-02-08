import { GameDefinition } from "../engine/dsl/types/world";

export type GameState = GameDefinition<
  1,
  {
    version: 1;
    locations: {
      home: { states: "home" };
      forest: { flags: "visited" };
      farmland: { flags: "visited" };
      farm: { flags: "visited" };
      hills: { flags: "visited" };
      mine: { flags: "visited" };
      mill: { flags: "visited"; states: "fixed" };
      swamp: { flags: "allowEntrance" };
      cabin: { flags: "visited"; states: "accessible" };
      cabinInside: { flags: "visited" };
      village: { flags: "visited" };
      bakery: { flags: "visited" };
      smithy: { flags: "visited"; states: "browsing" };
      darkwoods: { flags: "visited" };
      tower: { flags: "visited"; states: "firstVisit" | "inside" | "visited" };
      towerTop: { flags: "visited"; states: "sneakIn" };
      towerTopElevator: {};
      towerBaseElevator: { flags: "cellarDoorOpen" };
      river: { flags: "visited" };
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
        flags: "tiedElevator" | "tiedTooth";
      };
      millstone: { states: "seen" | "cart" | "elevator" | "used" | "rope" };
      grain: { states: "access" | "cart" | "flour" | "delivered" };
      fabric: { states: "possession" | "used" };
      medicine: { flags: "recipe" };
      cookies: { states: "price" | "possession" | "given" };
      gemstone: { states: "chopped" | "possession" | "used" };
      sword: { states: "need" | "possession" };
      necklace: { states: "need" | "possession" | "given" };
      treasureNotes: {
        states: "existence" | "possession";
        flags: "moonStone" | "route" | "startPoint";
      };
      ingredientList: {
        states: "possession";
        flags: "seen" | "roundLeaves" | "thornyLeaves" | "tooth" | "toadstools";
      };
      treasureHunt: { flags: "active" | "done" };
      moonStone: { states: "possession" };
      gold: { states: "possession" | "used" };
      runeStone: { states: "possession"; flags: "knowledgeUsage" };
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
        flags: "male" | "herbKnowledge" | "fungiKnowledge" | "mossKnowledge";
      };
      dwarf: { flags: "nameKnown"; states: "happy" };
      miller: {};
      horse: {
        states: "river" | "following" | "stable";
        flags: "hooves" | "cart" | "found" | "known";
      };
      dragon: { states: "known" | "found"; flags: "toothPulled" | "canTalk" };
      farmer: { flags: "visited" | "toldDragon" | "returnedHorse" };
      daughter: { states: "unloadStone" | "bakery" };
      witch: {};
      baker: { flags: "toldDragon" | "toldDaughter" };
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
      recipeBook: { counters: "page"; flags: "open" };
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
