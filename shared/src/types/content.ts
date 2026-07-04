export type ClassDefinition = {
  id: string;
  name: string;
  description: string;
  health: number;
  movement: number;
  defense: number;
  attackBonus: number;
  attackRange: number;
  damageDice: string;
  spellDamage: number;
  abilityId: string;
  coreAttributes: Record<string, number>;
  startingInventory: string[];
};

export type RaceDefinition = {
  id: string;
  name: string;
  description: string;
  traitName: string;
  traitDescription: string;
  coreBonuses: Record<string, number>;
  statBonuses: {
    maxHealth: number;
    movement: number;
    defense: number;
    attackBonus: number;
    attackRange: number;
    spellDamage: number;
  };
};

export type AbilityDefinition = {
  id: string;
  name: string;
  classId: string;
  description: string;
  range: number;
  targetType: "enemy" | "ally";
  usesAttackRoll: boolean;
  damageDice: string;
  healingDice: string;
  limit: "once_per_turn";
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

export type ItemDefinition = {
  id: string;
  name: string;
  rarity: string;
  price: number;
  effect: string;
  itemType: "weapon" | "armor" | "consumable" | "trinket";
  slot: "" | "weapon" | "armor";
  attackBonus: number;
  defenseBonus: number;
  spellDamageBonus: number;
  attackRangeBonus: number;
  maxHealthBonus: number;
  movementBonus: number;
  healDice: string;
};
