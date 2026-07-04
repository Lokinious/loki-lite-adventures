export type NpcDefinition = {
  id: string;
  name: string;
  personality: string;
  occupation: string;
  questHook: string;
};

export function createNpc(definition: NpcDefinition) {
  return {
    ...definition,
    summary: `${definition.name} is a ${definition.personality.toLowerCase()} ${definition.occupation.toLowerCase()}.`
  };
}
