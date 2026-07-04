export type CombatantTurn = {
  id: string;
  initiative: number;
  dexterityModifier: number;
};

export function createTurnOrder(combatants: CombatantTurn[]) {
  return [...combatants].sort((left, right) => {
    if (right.initiative !== left.initiative) {
      return right.initiative - left.initiative;
    }

    return right.dexterityModifier - left.dexterityModifier;
  });
}
