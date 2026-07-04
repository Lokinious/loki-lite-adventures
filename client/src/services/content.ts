import classes from "../../../content/classes.json";

export type PlayableClass = {
  id: string;
  name: string;
  health: number;
  movement: number;
  coreAttributes: Record<string, number>;
  startingInventory: string[];
};

const playableClasses = classes as PlayableClass[];
const classColors: Record<string, number> = {
  guardian: 0x34d399,
  ranger: 0x38bdf8,
  arcanist: 0xa78bfa,
  mystic: 0xf472b6
};

export function getPlayableClasses() {
  return playableClasses;
}

export function getClassColor(classId: string) {
  return classColors[classId] ?? 0xf8fafc;
}
