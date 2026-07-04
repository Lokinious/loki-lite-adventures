export type JoinMode = "create" | "join";
export type JoinRole = "player" | "dm";

export type InventoryItemView = {
  entryId: string;
  id: string;
  name: string;
  effect: string;
  itemType: "weapon" | "armor" | "consumable" | "trinket";
  slot: "" | "weapon" | "armor";
  equipped: boolean;
  usable: boolean;
  equippable: boolean;
};

export type AbilityView = {
  id: string;
  name: string;
  description: string;
  range: number;
  targetType: "enemy" | "ally";
  usesAttackRoll: boolean;
  limit: "once_per_turn";
  ready: boolean;
};

export type PlayerView = {
  id: string;
  name: string;
  role: "player";
  raceId: string;
  raceName: string;
  classId: string;
  className: string;
  characterIdentity: string;
  confirmedCharacter: boolean;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  movement: number;
  remainingMovement: number;
  might: number;
  agility: number;
  focus: number;
  spirit: number;
  defense: number;
  attackBonus: number;
  attackRange: number;
  spellDamage: number;
  damageDice: string;
  ability: AbilityView | null;
  alive: boolean;
  gold: number;
  inventory: InventoryItemView[];
  equippedWeapon: string;
  equippedArmor: string;
  xp: number;
  level: number;
  actionReady: boolean;
};

export type EnemyView = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  defense: number;
  x: number;
  y: number;
  movement: number;
  attackBonus: number;
  damageDice: string;
  alive: boolean;
};

export type LogEntryView = {
  id: number;
  message: string;
};

export type ActiveTurnView = {
  type: "player" | "enemy" | "none";
  id: string;
  name: string;
};

export type TurnOrderEntryView = {
  id: string;
  name: string;
  kind: "player" | "enemy";
  subtitle: string;
  active: boolean;
};

export type SceneView = {
  id: string;
  title: string;
  description: string;
  objective: string;
  mapId: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
};

export type SceneOptionView = {
  id: string;
  title: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
};

export type SceneActionView = {
  id: string;
  label: string;
};

export type MerchantItemView = {
  id: string;
  name: string;
  price: number;
  effect: string;
  itemType: "weapon" | "armor" | "consumable" | "trinket";
};

export type RaceOptionView = {
  id: string;
  name: string;
  description: string;
  traitName: string;
  traitDescription: string;
};

export type ClassOptionView = {
  id: string;
  name: string;
  description: string;
  health: number;
  movement: number;
  defense: number;
  attackBonus: number;
  attackRange: number;
  spellDamage: number;
  abilityId: string;
  abilityName: string;
};

export type VictorySummaryView = {
  playersSurvived: number;
  goldEarned: number;
  enemiesDefeated: number;
  totalTurns: number;
  adventureDuration: string;
};

export type LobbyView = {
  roomCode: string;
  selfRole: JoinRole;
  dmSessionId: string;
  dmName: string;
  adventureStarted: boolean;
  availableRaces: RaceOptionView[];
  availableClasses: ClassOptionView[];
  availableScenes: SceneOptionView[];
  currentScene: SceneView;
  sceneActions: SceneActionView[];
  gridWidth: number;
  gridHeight: number;
  activeTurn: ActiveTurnView;
  turnOrder: TurnOrderEntryView[];
  partyGold: number;
  totalGoldEarned: number;
  enemiesDefeated: number;
  completedEncounters: string[];
  merchantItems: MerchantItemView[];
  victorySummary: VictorySummaryView | null;
  players: PlayerView[];
  enemies: EnemyView[];
  publicLog: LogEntryView[];
  dmLog: LogEntryView[];
};
