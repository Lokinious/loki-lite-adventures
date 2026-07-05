export type JoinMode = "create" | "join";
export type JoinRole = "player" | "dm";
export type RoomPhase = "preparation" | "live" | "completed";
export type CampaignDifficulty = "casual" | "hardcore" | "legendary";
export type MapSlotKey = "starting" | "adventure" | "boss" | "camp";
export type PlayerLifeStatus = "alive" | "downed" | "dead" | "permanentlyDead";
export type VisibilityState = "hidden" | "visible" | "revealed" | "dm_only";

export type WorldEntityType =
  | "npc"
  | "shopkeeper"
  | "chest"
  | "barrel"
  | "door"
  | "lever"
  | "campfire"
  | "statue"
  | "treasure_chest"
  | "hidden_object"
  | "quest_marker"
  | "secret_marker"
  | "trap_marker"
  | "secret_passage_marker";

export type SkillCheckType =
  | "intimidation"
  | "persuasion"
  | "insight"
  | "perception"
  | "investigation"
  | "strength"
  | "dexterity"
  | "arcana"
  | "stealth";

export type SkillCheckVisibility = "public" | "dm" | "targeted";
export type QuestStatus = "hidden" | "offered" | "active" | "completed" | "failed";

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

export type WorldEntityView = {
  id: string;
  type: WorldEntityType;
  name: string;
  description: string;
  x: number;
  y: number;
  visibleToPlayers: boolean;
  discovered: boolean;
  linkedQuestId?: string;
  linkedShopId?: string;
  linkedItemId?: string;
  linkedNpcId?: string;
  linkedSecretId?: string;
  publicDetails: string;
};

export type NpcView = {
  id: string;
  name: string;
  role: string;
  personality: string;
  publicDescription: string;
  dialoguePrompt: string;
  questHooks: string;
  linkedEntityId?: string;
  visibleToPlayers: boolean;
  discovered: boolean;
};

export type ShopItemView = {
  itemId: string;
  name: string;
  effect: string;
  price: number;
  stock: number;
};

export type ShopView = {
  id: string;
  name: string;
  shopkeeperNpcId?: string;
  linkedEntityId?: string;
  visibleToPlayers: boolean;
  accessible: boolean;
  discountPercent: number;
  inventory: ShopItemView[];
};

export type QuestView = {
  id: string;
  title: string;
  publicObjective: string;
  rewardGold: number;
  rewardItems: string[];
  status: QuestStatus;
  assignedTo: "party" | string;
};

export type SecretView = {
  id: string;
  checkType: SkillCheckType;
  dc: number;
  revealText: string;
  revealed: boolean;
  linkedEntityId?: string;
};

export type SkillCheckView = {
  id: string;
  title: string;
  checkType: SkillCheckType;
  dc: number;
  targetPlayerIds: string[];
  targetNames: string[];
  visibility: SkillCheckVisibility;
  successMessage: string;
  failureMessage: string;
  status: "pending" | "completed";
  results: Array<{
    playerId: string;
    playerName: string;
    rolled: boolean;
    roll: number;
    total: number;
    success: boolean;
    message: string;
  }>;
};

export type PlayerSkillCheckView = {
  id: string;
  title: string;
  checkType: SkillCheckType;
  visibility: SkillCheckVisibility;
  status: "pending" | "completed";
  showDc: boolean;
  dc: number | null;
  canRoll: boolean;
  rolled: boolean;
  resultText: string;
};

export type RewardHistoryView = {
  id: string;
  message: string;
};

export type SessionMapView = {
  key: MapSlotKey;
  label: string;
  mapId: string;
  mapName: string;
  notes: string;
  spawnCount: number;
  encounterCount: number;
  entityCount: number;
};

export type CharacterProfileView = {
  id: string;
  name: string;
  raceName: string;
  className: string;
  level: number;
  xp: number;
  gold: number;
  status: PlayerLifeStatus;
  completedAdventures: number;
};

export type SessionTemplateView = {
  id: string;
  name: string;
};

export type PlayerView = {
  id: string;
  name: string;
  characterName: string;
  profileId: string;
  role: "player";
  raceId: string;
  raceName: string;
  classId: string;
  className: string;
  characterIdentity: string;
  confirmedCharacter: boolean;
  status: PlayerLifeStatus;
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
  abilitySlots: number;
  completedAdventures: number;
  completedQuestIds: string[];
  learnedAbilities: string[];
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
  roomPhase: RoomPhase;
  controlsLocked: boolean;
  campaignDifficulty: CampaignDifficulty;
  currentMapKey: MapSlotKey;
  sessionMaps: SessionMapView[];
  availableMaps: Array<{ id: string; name: string }>;
  savedTemplates: SessionTemplateView[];
  adventureStarted: boolean;
  availableRaces: RaceOptionView[];
  availableClasses: ClassOptionView[];
  availableScenes: SceneOptionView[];
  currentScene: SceneView;
  sceneActions: SceneActionView[];
  availableEntityTypes: Array<{ id: WorldEntityType; label: string }>;
  availableSkillChecks: SkillCheckType[];
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
  worldEntities: WorldEntityView[];
  npcs: NpcView[];
  shops: ShopView[];
  quests: QuestView[];
  secrets: SecretView[];
  skillChecks: SkillCheckView[];
  playerSkillChecks: PlayerSkillCheckView[];
  rewardHistory: RewardHistoryView[];
  sessionNotes: RewardHistoryView[];
  characterProfiles: CharacterProfileView[];
  players: PlayerView[];
  enemies: EnemyView[];
  publicLog: LogEntryView[];
  dmLog: LogEntryView[];
};
