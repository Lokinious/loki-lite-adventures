export type AttackInput = {
  attackRoll: number;
  targetArmorClass: number;
  damageRoll: number;
};

export type AttackResolution = {
  hit: boolean;
  damageApplied: number;
};

export function resolveAttack(input: AttackInput): AttackResolution {
  const hit = input.attackRoll >= input.targetArmorClass;

  return {
    hit,
    damageApplied: hit ? input.damageRoll : 0
  };
}
