// The event stage (album night): a public room the admin builds with the Edit room menu. Its pieces live in the database under stage/furni; this is the layout
// it starts from (and the one "Reset stage" puts back).

export const STAGE_ID = "stage";
export const STAGE_W = 14;
export const STAGE_H = 22;
/** the stage has no door on its back wall; its way out is the exit door in the left wall (see the "stageexit" piece) */
export const STAGE_DOOR_X = -5; // (nowhere: the stage has no door on its back wall)

/** the pieces made for the stage: they come first in the catalogue there */
export const STAGE_KINDS: ReadonlySet<string> = new Set(["stagefloor", "djset", "soundtower", "stagespeaker", "stagemic", "stagefence", "stagebar", "stagepub", "stageexit", "tshirtshop"]);

/** the ids of the stage floor blocks baked into the room (see stageDef) */
export const STAGE_BASE_PREFIX = "stagebase";

export interface StagePiece { kind: string; x: number; y: number; dir: number }

/** a row of the stage floor: 2x2 blocks, from x0 along the back wall */
const floorRow = (y: number): StagePiece[] => [0, 2, 4, 6, 8, 10, 12].map((x) => ({ kind: "stagefloor", x, y, dir: 0 }));

export const STAGE_DEFAULT: StagePiece[] = [
  // the stage floor: fourteen blocks, the whole width of the room along the back wall and 4 deep (baked into the room, see stageDef)
  ...floorRow(0), ...floorRow(2),
  // the layout the admin built in the test (saved from the database, so a reset puts back what he made)
  { kind: "djset", x: 5, y: 1, dir: 0 },
  { kind: "soundtower", x: 1, y: 1, dir: 0 },
  { kind: "soundtower", x: 12, y: 1, dir: 0 },
  { kind: "stagespeaker", x: 0, y: 3, dir: 0 },
  { kind: "stagespeaker", x: 12, y: 3, dir: 0 },
  { kind: "stagemic", x: 10, y: 2, dir: 2 },
  { kind: "stagefence", x: 0, y: 4, dir: 2 },
  { kind: "stagefence", x: 1, y: 4, dir: 2 },
  { kind: "stagefence", x: 2, y: 4, dir: 2 },
  { kind: "stagefence", x: 3, y: 4, dir: 2 },
  { kind: "stagefence", x: 4, y: 4, dir: 2 },
  { kind: "stagefence", x: 5, y: 4, dir: 2 },
  { kind: "stagefence", x: 6, y: 4, dir: 2 },
  { kind: "stagefence", x: 7, y: 4, dir: 2 },
  { kind: "stagefence", x: 8, y: 4, dir: 2 },
  { kind: "stagefence", x: 9, y: 4, dir: 2 },
  { kind: "stagefence", x: 10, y: 4, dir: 2 },
  { kind: "stagefence", x: 11, y: 4, dir: 2 },
  { kind: "stagefence", x: 12, y: 4, dir: 2 },
  { kind: "stagefence", x: 13, y: 4, dir: 2 },
  { kind: "tshirtshop", x: 0, y: 12, dir: 2 },
  { kind: "stageexit", x: 0, y: 20, dir: 2 },
];

/**
 * The room after the surprise (public room textures, see stageDef): the same stage without the t-shirt wall, and body bags lying on the floor.
 * Its pieces live in the database under stage2/furni (the admin changes them from the /event panel's preview); this is where they start.
 */
const BODY_BAGS: Array<[number, number, number]> = [[3, 7, 0], [8, 8, 2], [10, 6, 0], [2, 9, 0], [5, 12, 0], [10, 11, 2], [12, 13, 0], [7, 15, 2], [11, 16, 0], [3, 17, 2], [6, 10, 2], [9, 19, 2]];
export const STAGE_AFTER_DEFAULT: StagePiece[] = [
  ...STAGE_DEFAULT.filter((p) => p.kind !== "tshirtshop"),
  ...BODY_BAGS.map(([x, y, dir]) => ({ kind: "f_bodybag", x, y, dir })),
];
