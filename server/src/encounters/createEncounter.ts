export type EncounterEnemy = {
  enemyId: string;
  quantity: number;
};

export type EncounterDefinition = {
  id: string;
  sceneId: string;
  enemies: EncounterEnemy[];
};

export function createEncounter(definition: EncounterDefinition) {
  return {
    ...definition,
    totalEnemies: definition.enemies.reduce(
      (count, enemy) => count + enemy.quantity,
      0
    )
  };
}
