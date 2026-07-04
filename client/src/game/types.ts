export type JoinMode = "create" | "join";
export type JoinRole = "player" | "dm";

export type PlayerView = {
  id: string;
  name: string;
  role: "player";
  classId: string;
  className: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  movement: number;
  remainingMovement: number;
  defense: number;
  attackBonus: number;
  damageDice: string;
  alive: boolean;
  gold: number;
  inventory: string[];
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
