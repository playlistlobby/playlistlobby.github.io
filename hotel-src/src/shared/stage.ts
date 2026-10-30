// The event stage (album night): a public room the admin builds with the Edit room menu. Its pieces live in the database under stage/furni; this is the layout
// it starts from (and the one "Reset stage" puts back).

export const STAGE_ID = "stage";
export const STAGE_W = 20;
export const STAGE_H = 22;
/** the stage has no door on its back wall; its way out is the exit door in the left wall (see the "stageexit" piece) */
export const STAGE_DOOR_X = -5; // (nowhere: the stage has no door on its back wall)

/** the pieces made for the stage: they come first in the catalogue there */
export const STAGE_KINDS: ReadonlySet<string> = new Set(["stagefloor", "djset", "soundtower", "stagespeaker", "stagemic", "stagefence", "stagebar", "stageexit"]);

/** the ids of the stage floor blocks baked into the room (see stageDef) */
export const STAGE_BASE_PREFIX = "stagebase";

export interface StagePiece { kind: string; x: number; y: number; dir: number }

/** a row of the stage floor: 2x2 blocks, from x0 along the back wall */
const floorRow = (y: number): StagePiece[] => [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].map((x) => ({ kind: "stagefloor", x, y, dir: 0 }));

export const STAGE_DEFAULT: StagePiece[] = [
  // the stage: twenty blocks, the whole width of the room along the back wall and 4 deep
  ...floorRow(0), ...floorRow(2),
  // the DJ set on the back of the stage, a sound tower at each end, the speakers at the front corners and the mics at the front
  { kind: "djset", x: 9, y: 1, dir: 2 },
  { kind: "soundtower", x: 1, y: 1, dir: 0 }, { kind: "soundtower", x: 18, y: 1, dir: 0 },
  { kind: "stagespeaker", x: 0, y: 3, dir: 0 }, { kind: "stagespeaker", x: 19, y: 3, dir: 0 },
  { kind: "stagemic", x: 8, y: 3, dir: 4 }, { kind: "stagemic", x: 11, y: 3, dir: 4 },
  // the barrier in front of the stage, with a gap in the middle to walk up
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((x) => ({ kind: "stagefence", x, y: 4, dir: 2 })),
  // two more speakers at the front of the crowd
  { kind: "stagespeaker", x: 1, y: 5, dir: 0 }, { kind: "stagespeaker", x: 18, y: 5, dir: 0 },
  // the way out: a door in the left wall at the far end
  { kind: "stageexit", x: 0, y: 20, dir: 2 },
  // the bar along the left wall
  ...[10, 12, 14].map((y) => ({ kind: "stagebar", x: 1, y, dir: 2 })),
];
