export type ClassDefinition = {
  id: string;
  name: string;
  health: number;
  movement: number;
  coreAttributes: Record<string, number>;
  startingInventory: string[];
};

export type EnemyDefinition = {
  id: string;
  name: string;
  health: number;
  armorClass: number;
  movement: number;
  attacks: Array<{
    name: string;
    toHit: number;
    damage: string;
  }>;
};

export type MapDefinition = {
  id: string;
  name: string;
  width: number;
  height: number;
  fogOfWar: boolean;
};
