// The mines: a room behind a new door in the basement. Mine iron with your knife (a pickaxe is faster), craft a pickaxe or a machete on the bench from iron and wood,
// buy wood (or find it lying about) and sell iron to 6ixty. Pure data: the browser and the server both use it.

export const MINES_ID = "mines";
/** the mines are not open to players yet: the door is left out of the basement and mining/crafting is refused (the local test server has them anyway) */
export const MINES_OPEN = false;
export const MINES_W = 14;
export const MINES_H = 14;

/** one piece standing in the mines (the kinds are in src/rooms.ts FURNI_KINDS) */
export interface MinesPiece { id: string; kind: string; x: number; y: number; dir: number }

/** the ore rocks you mine (the server checks you stand next to one) */
export const MINE_ROCKS: MinesPiece[] = [
  { id: "mrock1", kind: "mrock", x: 3, y: 4, dir: 0 },
  { id: "mrock2", kind: "mrock", x: 1, y: 7, dir: 0 },
  { id: "mrock3", kind: "mrock", x: 5, y: 9, dir: 0 },
  { id: "mrock4", kind: "mrock", x: 2, y: 11, dir: 0 },
  { id: "mrock5", kind: "mrock", x: 8, y: 6, dir: 0 },
  { id: "mrock6", kind: "mrock", x: 10, y: 10, dir: 0 },
  { id: "mrock7", kind: "mrock", x: 12, y: 6, dir: 0 },
  { id: "mrock8", kind: "mrock", x: 7, y: 12, dir: 0 },
];

/** the crafting bench (an anvil), and 6ixty, who stands behind his wood and his pile of iron balls */
export const MINES_BENCH: MinesPiece = { id: "mbench", kind: "mbench", x: 0, y: 3, dir: 2 };
export const MINES_SIXTY = { x: 10, y: 0, dir: 4 };

/** everything else that stands in the mines (looks only) */
export const MINES_DECOR: MinesPiece[] = [
  { id: "mdec1", kind: "mlogs", x: 12, y: 0, dir: 0 },
  { id: "mdec2", kind: "mballs", x: 9, y: 0, dir: 0 },
  { id: "mdec3", kind: "msacks", x: 13, y: 2, dir: 0 },
  { id: "mdec4", kind: "mcart", x: 0, y: 5, dir: 2 },
  { id: "mdec5", kind: "mtools", x: 0, y: 2, dir: 2 },
  { id: "mdec6", kind: "mpick", x: 4, y: 6, dir: 2 },
  { id: "mdec7", kind: "mcart", x: 6, y: 4, dir: 0 },
  { id: "mdec8", kind: "mskull", x: 13, y: 8, dir: 0 },
  { id: "mdec9", kind: "mbigrock", x: 11, y: 11, dir: 0 },
  { id: "mdec10", kind: "mspire", x: 0, y: 13, dir: 0 },
  { id: "mdec11", kind: "mspire", x: 13, y: 13, dir: 0 },
  { id: "mdec12", kind: "mpick", x: 9, y: 8, dir: 2 },
  // torches on the walls
  { id: "mtorch1", kind: "mtorch", x: 0, y: 8, dir: 2 },
  { id: "mtorch2", kind: "mtorch", x: 0, y: 11, dir: 2 },
  { id: "mtorch3", kind: "mtorch", x: 4, y: 0, dir: 0 },
  { id: "mtorch4", kind: "mtorch", x: 7, y: 0, dir: 0 },
];

/** how long one swing takes until it gives an iron: with the knife, and with a pickaxe (2.4 times faster) */
export const MINE_KNIFE_MS = 24_000;
export const MINE_PICK_MS = 10_000;
/** the server lets a swing through a little early (the browser's timer and the network aren't exact) */
export const MINE_SLACK = 0.8;
/** how far from the rock you may stand (tiles) */
export const MINE_REACH = 2;

/** what 6ixty charges for a piece of wood (he sells it in the mines only), and what he pays for one */
export const WOOD_PRICE = 5;
/** the wood that lies about in the mines: twice as often as the seeds in the basement (a 50% chance every 10 minutes, up to 4 pieces lying at once) */
export const WOOD_SPAWN_CHANCE = 0.5;
export const WOOD_SPAWN_MAX = 4;

export interface CraftRecipe { id: "pickaxe" | "machete"; give: string; iron: number; wood: number; note: string }
export const CRAFT_RECIPES: CraftRecipe[] = [
  { id: "pickaxe", give: "pickaxe", iron: 6, wood: 2, note: "Mines iron 2.4 times faster than the knife." },
  { id: "machete", give: "machete", iron: 10, wood: 3, note: "Every stab draws twice the blood. Use it on a player like the knife." },
];
export const craftRecipe = (id: unknown): CraftRecipe | undefined => CRAFT_RECIPES.find((r) => r.id === id);
/** how far from the bench you may stand (tiles) */
export const CRAFT_REACH = 2;

/** every piece of the mines in one list (the rocks, the bench and the rest) */
export const MINES_PIECES: MinesPiece[] = [...MINE_ROCKS, MINES_BENCH, ...MINES_DECOR];
