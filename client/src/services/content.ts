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
  mystic: 0xf472b6,
  "enemy-goblin": 0xef4444,
  "entity-npc": 0xfbbf24,
  "entity-shopkeeper": 0xf59e0b,
  "entity-wall": 0x6b7280,
  "entity-chest": 0xeab308,
  "entity-bookshelf": 0x92400e,
  "entity-barrel": 0x92400e,
  "entity-door": 0x78350f,
  "entity-lever": 0x94a3b8,
  "entity-campfire": 0xf97316,
  "entity-statue": 0x9ca3af,
  "entity-treasure_chest": 0xeab308,
  "entity-hidden_object": 0x64748b,
  "entity-quest_marker": 0x22c55e,
  "entity-secret_marker": 0x06b6d4,
  "entity-trap_marker": 0xdc2626,
  "entity-secret_passage_marker": 0x14b8a6
};

export function getPlayableClasses() {
  return playableClasses;
}

export function getClassColor(classId: string) {
  return classColors[classId] ?? 0xf8fafc;
}
