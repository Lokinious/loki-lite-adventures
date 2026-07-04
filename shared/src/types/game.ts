export type CharacterClass = "Guardian" | "Ranger" | "Arcanist" | "Mystic";

export type CharacterSummary = {
  id: string;
  name: string;
  portrait: string;
  className: CharacterClass;
  health: number;
  movement: number;
  gold: number;
};

export type DiceRollRequest = {
  die: "d4" | "d6" | "d8" | "d10" | "d12" | "d20";
  count?: number;
  modifier?: number;
  advantage?: boolean;
  disadvantage?: boolean;
};
