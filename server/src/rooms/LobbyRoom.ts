import type { Client } from "colyseus";
import colyseus from "colyseus";
import abilityDefinitions from "../../../content/abilities.json" with { type: "json" };
import classDefinitions from "../../../content/classes.json" with { type: "json" };
import enemyDefinitions from "../../../content/enemies.json" with { type: "json" };
import itemDefinitions from "../../../content/items.json" with { type: "json" };
import mapDefinitions from "../../../content/maps.json" with { type: "json" };
import raceDefinitions from "../../../content/races.json" with { type: "json" };
import sceneDefinitions from "../../../content/scenes.json" with { type: "json" };
import { EnemyState, LobbyState, LogEntryState, PlayerState } from "./schema/LobbyState.js";

const { Room } = colyseus;

type JoinRole = "player" | "dm";

type JoinOptions = {
  roomCode?: string;
  playerName?: string;
  role?: JoinRole;
};

type SelectCharacterMessage = {
  classId: string;
};

type SelectRaceMessage = {
  raceId: string;
};

type MoveMessage = {
  x: number;
  y: number;
};

type AttackMessage = {
  targetId: string;
};

type SceneActionMessage = {
  actionId: string;
};

type PurchaseMessage = {
  itemId: string;
};

type ShopPurchaseMessage = {
  shopId: string;
  itemId: string;
};

type UseAbilityMessage = {
  abilityId: string;
  targetId: string;
};

type EquipItemMessage = {
  itemId: string;
};

type UseItemMessage = {
  itemId: string;
};

type RollSkillCheckMessage = {
  checkId: string;
};

type InteractEntityMessage = {
  entityId: string;
};

type SelectProfileMessage = {
  profileId: string;
};

type CampServiceMessage = {
  serviceId: "heal" | "revive";
};

type DmCommandMessage = {
  command: string;
};

type DmToolMessage = {
  tool:
    | "setMap"
    | "setMapDefinition"
    | "setPlayerSpawn"
    | "setPlayerStatus"
    | "setCampaignDifficulty"
    | "saveTemplate"
    | "loadTemplate"
    | "resetPreparation"
    | "createEncounterGroup"
    | "activateEncounterGroup"
    | "addSessionNote"
    | "createNpc"
    | "placeEntity"
    | "setEntityVisibility"
    | "createShop"
    | "addShopItem"
    | "createQuest"
    | "setQuestStatus"
    | "createSecret"
    | "revealSecret"
    | "createSkillCheck"
    | "giveReward"
    | "generateNpc"
    | "generateQuest"
    | "generateShop"
    | "generateSecret"
    | "configureEntityInteraction"
    | "setEntityNotes";
  entityType?: WorldEntityType;
  entityId?: string;
  npcId?: string;
  shopId?: string;
  questId?: string;
  secretId?: string;
  checkId?: string;
  itemId?: string;
  playerId?: string;
  playerName?: string;
  name?: string;
  role?: string;
  description?: string;
  publicDescription?: string;
  privateNotes?: string;
  dialoguePrompt?: string;
  questHooks?: string;
  title?: string;
  objective?: string;
  rewardItemId?: string;
  rewardItems?: string[];
  rewardGold?: number;
  amount?: number;
  checkType?: SkillCheckType;
  dc?: number;
  x?: number;
  y?: number;
  visibleToPlayers?: boolean;
  discovered?: boolean;
  target?: "party" | "all" | "player";
  visibility?: SkillCheckVisibility;
  successMessage?: string;
  failureMessage?: string;
  linkedEntityId?: string;
  linkedQuestId?: string;
  linkedShopId?: string;
  linkedItemId?: string;
  linkedSecretId?: string;
  stock?: number;
  price?: number;
  targetPlayerIds?: string[];
  assignTo?: "party" | string;
  mapKey?: MapSlotKey;
  mapId?: string;
  note?: string;
  templateName?: string;
  encounterId?: string;
  enemyId?: string;
  enemyIds?: string[];
  difficulty?: CampaignDifficulty;
  visibilityState?: VisibilityState;
  playerProfileId?: string;
  status?: PlayerLifeStatus;
  interactionTitle?: string;
  targetPlayerMode?: "single" | "selected" | "party";
  effectType?: AutomationEffectType;
  failureEffectType?: AutomationEffectType;
  discountPercent?: number;
  sourceEntityId?: string;
};

type DmActionMessage = {
  actionId:
    | "startAdventure"
    | "advanceScene"
    | "previousScene"
    | "restartScene"
    | "setScene"
    | "spawnGoblin"
    | "spawnGoblinChief"
    | "awardPartyGold"
    | "addPublicLogMessage"
    | "setMap"
    | "completeSession";
  sceneId?: string;
  amount?: number;
  message?: string;
  mapKey?: MapSlotKey;
};

type CharacterDefinition = {
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
  coreAttributes: {
    might: number;
    agility: number;
    focus: number;
    spirit: number;
  };
  startingInventory: string[];
};

type RaceDefinition = {
  id: string;
  name: string;
  description: string;
  traitName: string;
  traitDescription: string;
  coreBonuses: {
    might: number;
    agility: number;
    focus: number;
    spirit: number;
  };
  statBonuses: {
    maxHealth: number;
    movement: number;
    defense: number;
    attackBonus: number;
    attackRange: number;
    spellDamage: number;
  };
};

type AbilityDefinition = {
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

type EnemyDefinition = {
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

type ItemDefinition = {
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

type MapDefinition = {
  id: string;
  name: string;
  width: number;
  height: number;
};

type SceneDefinition = {
  id: string;
  title: string;
  description: string;
  mapId: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
  nextSceneId?: string;
  objective?: string;
};

type RoomPhase = "preparation" | "live" | "completed";
type CampaignDifficulty = "casual" | "hardcore" | "legendary";
type MapSlotKey = "starting" | "adventure" | "boss" | "camp";
type PlayerLifeStatus = "alive" | "downed" | "dead" | "permanentlyDead";
type VisibilityState = "hidden" | "visible" | "revealed" | "dm_only";

type WorldEntityType =
  | "npc"
  | "shopkeeper"
  | "treasure_chest"
  | "wall"
  | "chest"
  | "bookshelf"
  | "barrel"
  | "door"
  | "lever"
  | "campfire"
  | "statue"
  | "hidden_object"
  | "quest_marker"
  | "secret_marker"
  | "trap_marker"
  | "secret_passage_marker";

type QuestStatus = "hidden" | "offered" | "active" | "completed" | "failed";
type SkillCheckVisibility = "public" | "dm" | "targeted";
type SkillCheckType =
  | "intimidation"
  | "persuasion"
  | "insight"
  | "perception"
  | "investigation"
  | "strength"
  | "dexterity"
  | "arcana"
  | "stealth";

type RewardType = "gold" | "item" | "xp" | "healing" | "quest_progress";
type AutomationEffectType =
  | "none"
  | "reveal_secret"
  | "reward"
  | "quest_progress"
  | "shop_discount"
  | "trigger_event"
  | "trigger_combat"
  | "narration";

type Point = {
  x: number;
  y: number;
};

type ActiveTurnView = {
  type: "player" | "enemy" | "none";
  id: string;
  name: string;
};

type TurnOrderEntry = {
  id: string;
  name: string;
  kind: "player" | "enemy";
  subtitle: string;
  active: boolean;
};

type SceneView = {
  id: string;
  title: string;
  description: string;
  objective: string;
  mapId: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
};

type SceneOptionView = {
  id: string;
  title: string;
  sceneType: "story" | "encounter" | "shop" | "victory";
};

type SceneActionView = {
  id: string;
  label: string;
};

type MerchantItemView = {
  id: string;
  name: string;
  price: number;
  effect: string;
  itemType: ItemDefinition["itemType"];
};

type VictorySummaryView = {
  playersSurvived: number;
  goldEarned: number;
  enemiesDefeated: number;
  totalTurns: number;
  adventureDuration: string;
};

type LogEntryView = {
  id: number;
  message: string;
};

type InventoryItemView = {
  entryId: string;
  id: string;
  name: string;
  effect: string;
  itemType: ItemDefinition["itemType"];
  slot: ItemDefinition["slot"];
  equipped: boolean;
  usable: boolean;
  equippable: boolean;
};

type WorldEntityView = {
  id: string;
  type: WorldEntityType;
  name: string;
  description: string;
  x: number;
  y: number;
  visibleToPlayers: boolean;
  discovered: boolean;
  linkedQuestId: string | undefined;
  linkedShopId: string | undefined;
  linkedItemId: string | undefined;
  linkedNpcId: string | undefined;
  linkedSecretId: string | undefined;
  publicDetails: string;
  interaction: EntityInteractionView | null;
  dmNotes: string | undefined;
};

type NpcView = {
  id: string;
  name: string;
  role: string;
  personality: string;
  publicDescription: string;
  dialoguePrompt: string;
  questHooks: string;
  linkedEntityId: string | undefined;
  visibleToPlayers: boolean;
  discovered: boolean;
};

type ShopItemView = {
  itemId: string;
  name: string;
  effect: string;
  price: number;
  stock: number;
};

type ShopView = {
  id: string;
  name: string;
  shopkeeperNpcId: string | undefined;
  linkedEntityId: string | undefined;
  visibleToPlayers: boolean;
  accessible: boolean;
  discountPercent: number;
  inventory: ShopItemView[];
};

type QuestView = {
  id: string;
  title: string;
  publicObjective: string;
  rewardGold: number;
  rewardItems: string[];
  status: QuestStatus;
  assignedTo: "party" | string;
};

type SecretView = {
  id: string;
  checkType: SkillCheckType;
  dc: number;
  revealText: string;
  revealed: boolean;
  linkedEntityId: string | undefined;
};

type EntityInteractionView = {
  title: string;
  checkType: SkillCheckType;
  dc: number;
  successText: string;
  failureText: string;
  targetMode: "single" | "selected" | "party";
};

type SkillCheckView = {
  id: string;
  title: string;
  description: string;
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

type PlayerSkillCheckView = {
  id: string;
  title: string;
  description: string;
  checkType: SkillCheckType;
  visibility: SkillCheckVisibility;
  status: "pending" | "completed";
  showDc: boolean;
  dc: number | null;
  canRoll: boolean;
  rolled: boolean;
  resultText: string;
};

type RewardHistoryView = {
  id: string;
  message: string;
};

type SessionMapView = {
  key: MapSlotKey;
  label: string;
  mapId: string;
  mapName: string;
  notes: string;
  spawnCount: number;
  encounterCount: number;
  entityCount: number;
};

type CharacterProfileView = {
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

type SessionTemplateView = {
  id: string;
  name: string;
};

type RaceOptionView = {
  id: string;
  name: string;
  description: string;
  traitName: string;
  traitDescription: string;
};

type ClassOptionView = {
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

type AbilityView = {
  id: string;
  name: string;
  description: string;
  range: number;
  targetType: AbilityDefinition["targetType"];
  usesAttackRoll: boolean;
  limit: AbilityDefinition["limit"];
  ready: boolean;
};

type WorldEntityRecord = {
  id: string;
  mapKey: MapSlotKey;
  type: WorldEntityType;
  name: string;
  description: string;
  dmNotes: string | undefined;
  x: number;
  y: number;
  visibilityState: VisibilityState;
  discovered: boolean;
  linkedQuestId: string | undefined;
  linkedShopId: string | undefined;
  linkedItemId: string | undefined;
  linkedNpcId: string | undefined;
  linkedSecretId: string | undefined;
  interaction: EntityInteractionRecord | undefined;
};

type NpcRecord = {
  id: string;
  name: string;
  role: string;
  personality: string;
  publicDescription: string;
  privateNotes: string;
  dialoguePrompt: string;
  questHooks: string;
  linkedEntityId: string | undefined;
};

type ShopInventoryEntry = {
  itemId: string;
  price: number;
  stock: number;
};

type ShopRecord = {
  id: string;
  name: string;
  shopkeeperNpcId: string | undefined;
  linkedEntityId: string | undefined;
  inventory: ShopInventoryEntry[];
  discountPercent: number;
};

type QuestRecord = {
  id: string;
  title: string;
  publicObjective: string;
  privateNotes: string;
  rewardGold: number;
  rewardItems: string[];
  completionCondition: string;
  status: QuestStatus;
  assignedTo: "party" | string;
};

type SecretRecord = {
  id: string;
  mapKey: MapSlotKey;
  checkType: SkillCheckType;
  dc: number;
  revealText: string;
  privateNotes: string;
  revealed: boolean;
  linkedEntityId: string | undefined;
  unlockMapKey: MapSlotKey | undefined;
};

type SkillCheckResult = {
  rolled: boolean;
  roll: number;
  total: number;
  success: boolean;
  message: string;
};

type RewardGrant = {
  type: RewardType;
  amount: number | undefined;
  itemId: string | undefined;
  questId: string | undefined;
  targetPlayerIds: string[] | undefined;
};

type AutomationEffect = {
  type: AutomationEffectType;
  reward: RewardGrant | undefined;
  linkedSecretId: string | undefined;
  questId: string | undefined;
  linkedShopId: string | undefined;
  discountPercent: number | undefined;
  encounterId: string | undefined;
  narration: string | undefined;
};

type EntityInteractionRecord = {
  title: string;
  description: string;
  checkType: SkillCheckType;
  dc: number;
  targetMode: "single" | "selected" | "party";
  visibility: SkillCheckVisibility;
  successText: string;
  failureText: string;
  successEffect: AutomationEffect;
  failureEffect: AutomationEffect;
};

type SessionMapRecord = {
  key: MapSlotKey;
  label: string;
  mapId: string;
  notes: string;
  spawnPoints: Record<string, Point>;
};

type EncounterGroupRecord = {
  id: string;
  mapKey: MapSlotKey;
  name: string;
  enemyIds: string[];
  trigger: Point;
  active: boolean;
  notes: string;
};

type PersistentCharacterRecord = {
  id: string;
  ownerName: string;
  name: string;
  raceId: string;
  raceName: string;
  classId: string;
  className: string;
  characterIdentity: string;
  level: number;
  xp: number;
  gold: number;
  inventory: string[];
  equippedWeapon: string;
  equippedArmor: string;
  status: PlayerLifeStatus;
  health: number;
  maxHealth: number;
  attackBonus: number;
  defense: number;
  movement: number;
  completedAdventures: number;
  completedQuestIds: string[];
  learnedAbilities: string[];
};

type SessionTemplateRecord = {
  id: string;
  name: string;
  campaignDifficulty: CampaignDifficulty;
  maps: SessionMapRecord[];
  worldEntities: WorldEntityRecord[];
  npcs: NpcRecord[];
  shops: ShopRecord[];
  quests: QuestRecord[];
  secrets: SecretRecord[];
  encounterGroups: EncounterGroupRecord[];
  sessionNotes: RewardHistoryView[];
};

type SkillCheckRecord = {
  id: string;
  title: string;
  description: string;
  checkType: SkillCheckType;
  dc: number;
  targetPlayerIds: string[];
  visibility: SkillCheckVisibility;
  successMessage: string;
  failureMessage: string;
  status: "pending" | "completed";
  results: Record<string, SkillCheckResult>;
  linkedSecretId: string | undefined;
  successReward: RewardGrant | undefined;
  failureReward: RewardGrant | undefined;
  successEffect: AutomationEffect | undefined;
  failureEffect: AutomationEffect | undefined;
  sourceEntityId: string | undefined;
};

type RoomSnapshot = {
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
  turnOrder: TurnOrderEntry[];
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
  players: Array<{
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
  }>;
  enemies: Array<{
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
  }>;
  publicLog: LogEntryView[];
  dmLog: LogEntryView[];
};

const maxClients = 7;
const maxLogEntries = 60;
const startingPlayerGold = 10;

const availableAbilities = abilityDefinitions as AbilityDefinition[];
const availableClasses = classDefinitions as CharacterDefinition[];
const availableEnemies = enemyDefinitions as EnemyDefinition[];
const availableItems = itemDefinitions as ItemDefinition[];
const availableMaps = mapDefinitions as MapDefinition[];
const availableRaces = raceDefinitions as RaceDefinition[];
const availableScenes = sceneDefinitions as SceneDefinition[];

const defaultClass = availableClasses[0] ?? {
  id: "guardian",
  name: "Guardian",
  description: "Guardian",
  health: 14,
  movement: 5,
  defense: 14,
  attackBonus: 5,
  attackRange: 1,
  damageDice: "1d8+3",
  spellDamage: 0,
  abilityId: "shield_bash",
  coreAttributes: {
    might: 3,
    agility: 1,
    focus: 0,
    spirit: 1
  },
  startingInventory: []
};

const defaultRace = availableRaces[0] ?? {
  id: "human",
  name: "Human",
  description: "Flexible generalist",
  traitName: "Adaptable",
  traitDescription: "Once per encounter, reroll one failed attack or ability roll.",
  coreBonuses: {
    might: 1,
    agility: 1,
    focus: 1,
    spirit: 1
  },
  statBonuses: {
    maxHealth: 0,
    movement: 0,
    defense: 0,
    attackBonus: 0,
    attackRange: 0,
    spellDamage: 0
  }
};

const abilitiesById = new Map(availableAbilities.map((abilityDefinition) => [abilityDefinition.id, abilityDefinition]));
const classesById = new Map(availableClasses.map((classDefinition) => [classDefinition.id, classDefinition]));
const enemiesById = new Map(availableEnemies.map((enemyDefinition) => [enemyDefinition.id, enemyDefinition]));
const itemsById = new Map(availableItems.map((itemDefinition) => [itemDefinition.id, itemDefinition]));
const mapsById = new Map(availableMaps.map((mapDefinition) => [mapDefinition.id, mapDefinition]));
const racesById = new Map(availableRaces.map((raceDefinition) => [raceDefinition.id, raceDefinition]));
const scenesById = new Map(availableScenes.map((sceneDefinition) => [sceneDefinition.id, sceneDefinition]));
const orderedSceneIds = availableScenes.map((sceneDefinition) => sceneDefinition.id);
const merchantItemIds = ["healing_potion", "iron_sword", "leather_armor"];

const spawnPoints: Point[] = [
  { x: 1, y: 1 },
  { x: 8, y: 1 },
  { x: 1, y: 6 },
  { x: 8, y: 6 },
  { x: 1, y: 3 },
  { x: 8, y: 3 }
];

const encounterSpawnBySceneId: Record<string, Array<{ enemyId: string; position: Point }>> = {
  forest: [{ enemyId: "goblin", position: { x: 4, y: 1 } }],
  boss: [{ enemyId: "goblin_chief", position: { x: 5, y: 1 } }]
};

const availableEntityTypes: Array<{ id: WorldEntityType; label: string }> = [
  { id: "npc", label: "NPC" },
  { id: "shopkeeper", label: "Shopkeeper" },
  { id: "wall", label: "Wall" },
  { id: "chest", label: "Chest" },
  { id: "bookshelf", label: "Bookshelf" },
  { id: "barrel", label: "Barrel" },
  { id: "door", label: "Door" },
  { id: "lever", label: "Lever" },
  { id: "campfire", label: "Campfire" },
  { id: "statue", label: "Statue" },
  { id: "treasure_chest", label: "Treasure Chest" },
  { id: "hidden_object", label: "Hidden Object" },
  { id: "quest_marker", label: "Quest Marker" },
  { id: "secret_marker", label: "Secret Marker" },
  { id: "trap_marker", label: "Trap Marker" },
  { id: "secret_passage_marker", label: "Secret Passage" }
];

const availableSkillChecks: SkillCheckType[] = [
  "intimidation",
  "persuasion",
  "insight",
  "perception",
  "investigation",
  "strength",
  "dexterity",
  "arcana",
  "stealth"
];

const availableMapSlots: Array<{ key: MapSlotKey; label: string; defaultMapId: string }> = [
  { key: "starting", label: "Starting Area", defaultMapId: "tavern" },
  { key: "adventure", label: "Adventure Area", defaultMapId: "forest" },
  { key: "boss", label: "Boss Area", defaultMapId: "goblin_camp" },
  { key: "camp", label: "Camp", defaultMapId: "camp" }
];

const levelThresholds = [0, 100, 250, 500, 1000];

const persistentCharacterProfiles = new Map<string, PersistentCharacterRecord[]>();
const persistentSessionTemplates = new Map<string, SessionTemplateRecord>();

export class LobbyRoom extends Room<LobbyState> {
  override maxClients = maxClients;
  private logIndex = 0;
  private roomPhase: RoomPhase = "preparation";
  private currentMapKey: MapSlotKey = "starting";
  private campaignDifficulty: CampaignDifficulty = "casual";
  private rewardHistory: RewardHistoryView[] = [];
  private dmNotes: RewardHistoryView[] = [];
  private sessionNotes: RewardHistoryView[] = [];
  private sessionMaps = new Map<MapSlotKey, SessionMapRecord>();
  private worldEntities = new Map<string, WorldEntityRecord>();
  private npcs = new Map<string, NpcRecord>();
  private shops = new Map<string, ShopRecord>();
  private quests = new Map<string, QuestRecord>();
  private secrets = new Map<string, SecretRecord>();
  private skillChecks = new Map<string, SkillCheckRecord>();
  private encounterGroups = new Map<string, EncounterGroupRecord>();
  private generatorIndex = 0;

  override onCreate(options: JoinOptions) {
    const state = new LobbyState();
    state.roomCode = normalizeRoomCode(options.roomCode);
    this.setState(state);
    this.setMetadata({ roomCode: state.roomCode });
    this.initializeSessionMaps();
    this.applyMapState("starting");
    this.syncState();

    this.onMessage("selectCharacter", (client, message: SelectCharacterMessage) => {
      this.handleCharacterSelection(client, message);
    });

    this.onMessage("selectRace", (client, message: SelectRaceMessage) => {
      this.handleRaceSelection(client, message);
    });

    this.onMessage("confirmCharacter", (client) => {
      this.handleCharacterConfirmation(client);
    });

    this.onMessage("selectProfile", (client, message: SelectProfileMessage) => {
      this.handleProfileSelection(client, message);
    });

    this.onMessage("requestMove", (client, message: MoveMessage) => {
      this.handleMoveRequest(client, message);
    });

    this.onMessage("requestAttack", (client, message: AttackMessage) => {
      this.handleAttackRequest(client, message);
    });

    this.onMessage("requestUseAbility", (client, message: UseAbilityMessage) => {
      this.handleAbilityRequest(client, message);
    });

    this.onMessage("requestEquipItem", (client, message: EquipItemMessage) => {
      this.handleEquipItemRequest(client, message);
    });

    this.onMessage("requestUseItem", (client, message: UseItemMessage) => {
      this.handleUseItemRequest(client, message);
    });

    this.onMessage("endTurn", (client) => {
      this.handleEndTurn(client);
    });

    this.onMessage("requestSceneAction", (client, message: SceneActionMessage) => {
      this.handleSceneAction(client, message);
    });

    this.onMessage("requestPurchase", (client, message: PurchaseMessage) => {
      this.handlePurchaseRequest(client, message);
    });

    this.onMessage("requestShopPurchase", (client, message: ShopPurchaseMessage) => {
      this.handleDynamicShopPurchase(client, message);
    });

    this.onMessage("requestRollSkillCheck", (client, message: RollSkillCheckMessage) => {
      this.handleSkillCheckRoll(client, message);
    });

    this.onMessage("requestInteractEntity", (client, message: InteractEntityMessage) => {
      this.handleEntityInteraction(client, message);
    });

    this.onMessage("requestCampService", (client, message: CampServiceMessage) => {
      this.handleCampService(client, message);
    });

    this.onMessage("requestDmAction", (client, message: DmActionMessage) => {
      this.handleDmAction(client, message);
    });

    this.onMessage("requestDmTool", (client, message: DmToolMessage) => {
      this.handleDmTool(client, message);
    });

    this.onMessage("requestDmCommand", (client, message: DmCommandMessage) => {
      this.handleDmCommand(client, message);
    });

    this.onMessage("requestState", (client) => {
      this.sendSnapshot(client);
    });
  }

  override onJoin(client: Client, options: JoinOptions) {
    const role = normalizeJoinRole(options.role);
    const playerName = sanitizePlayerName(options.playerName);

    if (role === "dm") {
      if (this.state.dmSessionId && this.state.dmSessionId !== client.sessionId) {
        throw new Error("This room already has a Dungeon Master.");
      }

      this.state.dmSessionId = client.sessionId;
      this.state.dmName = playerName;
      this.addPublicLog(`${playerName} joined as the Dungeon Master.`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const player = this.createPlayerState(client.sessionId, playerName, defaultClass, defaultRace);
    const existingProfiles = persistentCharacterProfiles.get(normalizeProfileOwner(playerName)) ?? [];
    const latestProfile = existingProfiles[existingProfiles.length - 1];

    if (this.roomPhase !== "preparation" && latestProfile) {
      if (this.campaignDifficulty === "legendary" && latestProfile.status === "permanentlyDead") {
        throw new Error(`${latestProfile.name} is permanently dead and cannot rejoin this legendary campaign.`);
      }

      this.applyProfileToPlayer(player, latestProfile);
    }

    this.state.players.set(client.sessionId, player);
    this.state.turnOrder.push(client.sessionId);
    this.repositionPlayers();
    this.recalculatePartyGold();

    if (this.getCurrentScene().sceneType === "encounter" && !this.hasActiveTurn()) {
      this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
    }

    this.addPublicLog(`${player.name} joined room ${this.state.roomCode}.`);
    this.syncState();
    this.publishSnapshots();
  }

  override onLeave(client: Client) {
    if (this.isDmSession(client.sessionId)) {
      const dmName = this.state.dmName || "The Dungeon Master";
      this.state.dmSessionId = "";
      this.state.dmName = "";
      this.addPublicLog(`${dmName} left the room.`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    const playerName = player.name;
    const wasActiveTurn = this.isPlayerTurn(client.sessionId);

    this.state.players.delete(client.sessionId);
    this.removeTurnOrderEntry(client.sessionId);
    this.recalculatePartyGold();

    if (wasActiveTurn) {
      this.addPublicLog(`${playerName} left the room.`);
      this.advanceTurn();
      return;
    }

    if (this.getLivingPlayerOrder().length === 0) {
      this.clearActiveTurn();
    }

    this.addPublicLog(`${playerName} left the room.`);
    this.syncState();
    this.publishSnapshots();
  }

  override onDispose() {
    this.state.players.clear();
    this.state.enemies.clear();
    clearStringArray(this.state.turnOrder);
    clearStringArray(this.state.completedEncounters);
    clearLogArray(this.state.publicLog);
    clearLogArray(this.state.dmLog);
    this.worldEntities.clear();
    this.npcs.clear();
    this.shops.clear();
    this.quests.clear();
    this.secrets.clear();
    this.skillChecks.clear();
    this.encounterGroups.clear();
    this.sessionMaps.clear();
    this.rewardHistory = [];
    this.dmNotes = [];
    this.sessionNotes = [];
  }

  private initializeSessionMaps() {
    this.sessionMaps.clear();

    for (const slot of availableMapSlots) {
      this.sessionMaps.set(slot.key, {
        key: slot.key,
        label: slot.label,
        mapId: slot.defaultMapId,
        notes: slot.key === "camp" ? "A safe hub between adventures." : "",
        spawnPoints: {}
      });
    }
  }

  private getSessionMap(mapKey: MapSlotKey = this.currentMapKey) {
    return this.sessionMaps.get(mapKey) ?? defaultSessionMapRecord(mapKey);
  }

  private handleCharacterSelection(client: Client, message: SelectCharacterMessage) {
    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not select adventurer classes.");
      return;
    }

    const player = this.state.players.get(client.sessionId);
    if (!player) {
      return;
    }

    if (this.roomPhase !== "preparation") {
      this.rejectAction(client, "Classes can only be changed in the room lobby.");
      return;
    }

    const selectedClass = classesById.get(message.classId);

    if (!selectedClass) {
      this.rejectAction(client, "That class is not available.");
      return;
    }

    player.classId = selectedClass.id;
    player.className = selectedClass.name;
    player.characterIdentity = `${player.raceName} ${selectedClass.name}`;
    player.confirmedCharacter = false;
    player.equippedWeapon = "";
    player.equippedArmor = "";
    resetStringArray(player.inventory, selectedClass.startingInventory ?? []);
    applyDerivedStatsToPlayer(player, { healToFull: true, resetTurnResources: true });

    this.syncState();
    this.publishSnapshots();
  }

  private handleRaceSelection(client: Client, message: SelectRaceMessage) {
    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not select adventurer races.");
      return;
    }

    const player = this.state.players.get(client.sessionId);
    if (!player) {
      return;
    }

    if (this.roomPhase !== "preparation") {
      this.rejectAction(client, "Races can only be changed in the room lobby.");
      return;
    }

    const selectedRace = racesById.get(message.raceId);

    if (!selectedRace) {
      this.rejectAction(client, "That race is not available.");
      return;
    }

    player.raceId = selectedRace.id;
    player.raceName = selectedRace.name;
    player.characterIdentity = `${selectedRace.name} ${player.className}`;
    player.confirmedCharacter = false;
    applyDerivedStatsToPlayer(player, { healToFull: true, resetTurnResources: true });
    this.syncState();
    this.publishSnapshots();
  }

  private handleCharacterConfirmation(client: Client) {
    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not confirm player characters.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.roomPhase !== "preparation") {
      this.rejectAction(client, "Characters can only be confirmed in the room lobby.");
      return;
    }

    player.confirmedCharacter = true;
    applyDerivedStatsToPlayer(player, { healToFull: true, resetTurnResources: true });
    if (!player.characterName) {
      player.characterName = `${player.name} ${player.className}`.slice(0, 24);
    }
    this.persistCharacterProfile(player);
    this.addPublicLog(`${player.name} confirms ${player.characterIdentity}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private handleProfileSelection(client: Client, message: SelectProfileMessage) {
    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not load player characters.");
      return;
    }

    if (this.roomPhase !== "preparation") {
      this.rejectAction(client, "Profiles can only be changed during preparation.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    const profiles = persistentCharacterProfiles.get(normalizeProfileOwner(player.name)) ?? [];
    const profile = profiles.find((entry) => entry.id === message.profileId);

    if (!profile) {
      this.rejectAction(client, "That character profile is no longer available.");
      return;
    }

    if (this.campaignDifficulty === "legendary" && profile.status === "permanentlyDead") {
      this.rejectAction(client, `${profile.name} is permanently dead and cannot rejoin this legendary campaign.`);
      return;
    }

    this.applyProfileToPlayer(player, profile);
    this.addPublicLog(`${player.name} loads ${profile.name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private handleMoveRequest(client: Client, message: MoveMessage) {
    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters observe the battlefield but do not move player tokens.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.roomPhase !== "live") {
      this.rejectAction(client, "The session is still in preparation mode.");
      return;
    }

    if (this.getCurrentScene().sceneType !== "encounter") {
      this.rejectAction(client, "Movement is only available during encounters.");
      return;
    }

    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "It is not your turn.");
      return;
    }

    if (!player.alive) {
      this.rejectAction(client, "Defeated adventurers cannot move.");
      return;
    }

    if (!isWholeNumber(message.x) || !isWholeNumber(message.y)) {
      this.rejectAction(client, "Choose a valid tile.");
      return;
    }

    if (
      message.x < 0 ||
      message.y < 0 ||
      message.x >= this.state.gridWidth ||
      message.y >= this.state.gridHeight
    ) {
      this.rejectAction(client, "That tile is outside the battle map.");
      return;
    }

    const distance = calculateDistance(player.x, player.y, message.x, message.y);

    if (distance === 0) {
      return;
    }

    if (distance > player.remainingMovement) {
      this.rejectAction(client, "That move is farther than your remaining movement.");
      return;
    }

    if (this.isOccupied(message.x, message.y, client.sessionId)) {
      this.rejectAction(client, "That tile is already occupied.");
      return;
    }

    player.x = message.x;
    player.y = message.y;
    player.remainingMovement -= distance;

    this.addPublicLog(
      `${player.name} moved to (${message.x + 1}, ${message.y + 1}) with ${player.remainingMovement} movement left.`
    );
    this.syncState();
    this.publishSnapshots();
  }

  private handleAttackRequest(client: Client, message: AttackMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "The session has not launched yet.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not take player attack actions.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.getCurrentScene().sceneType !== "encounter") {
      this.rejectAction(client, "Attack actions are only available during encounters.");
      return;
    }

    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "It is not your turn.");
      return;
    }

    if (!player.alive) {
      this.rejectAction(client, "Defeated adventurers cannot attack.");
      return;
    }

    if (player.actionUsed) {
      this.rejectAction(client, "You already used your action this turn.");
      return;
    }

    const enemy = this.state.enemies.get(message.targetId);

    if (!enemy || !enemy.alive) {
      this.rejectAction(client, "That target is no longer available.");
      return;
    }

    if (calculateDistance(player.x, player.y, enemy.x, enemy.y) > player.attackRange) {
      this.rejectAction(client, "That target is out of range.");
      return;
    }

    player.actionUsed = true;
    this.addPublicLog(`${player.name} attacks ${enemy.name}.`);

    const attackResolution = resolvePlayerAttackRoll(player, enemy.defense);
    this.addPublicLog(
      `Attack roll: d20 (${attackResolution.roll}) + ${player.attackBonus} = ${attackResolution.total} vs ${enemy.defense}.`
    );

    if (attackResolution.traitMessage) {
      this.addPublicLog(attackResolution.traitMessage);
    }

    if (!attackResolution.hit) {
      this.addPublicLog(`${player.name} misses ${enemy.name}.`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const damageTotal = calculatePlayerDamage(player, player.damageDice);
    enemy.hp = Math.max(0, enemy.hp - damageTotal);

    this.addPublicLog(`${player.name} hits ${enemy.name}.`);
    this.addPublicLog(
      `Damage dealt: ${damageTotal}. ${enemy.name} is now at ${enemy.hp}/${enemy.maxHp} HP.`
    );

    if (enemy.hp === 0) {
      enemy.alive = false;
      this.state.enemiesDefeated += 1;
      this.rewardExperience(enemy.name.includes("Chief") ? 10 : 5);
      this.addPublicLog(`${enemy.name} is defeated.`);

      if (!this.getLivingEnemies().length) {
        this.handleEncounterCompletion(player, enemy);
        return;
      }
    }

    this.syncState();
    this.publishSnapshots();
  }

  private handleAbilityRequest(client: Client, message: UseAbilityMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "The session has not launched yet.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not use player abilities.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.getCurrentScene().sceneType !== "encounter") {
      this.rejectAction(client, "Abilities are only available during encounters.");
      return;
    }

    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "It is not your turn.");
      return;
    }

    if (!player.alive) {
      this.rejectAction(client, "Defeated adventurers cannot use abilities.");
      return;
    }

    if (player.actionUsed) {
      this.rejectAction(client, "You already used your action this turn.");
      return;
    }

    if (message.abilityId !== player.abilityId) {
      this.rejectAction(client, "That ability is not available to your class.");
      return;
    }

    const ability = abilitiesById.get(message.abilityId);

    if (!ability) {
      this.rejectAction(client, "That ability does not exist.");
      return;
    }

    if (ability.targetType === "enemy") {
      const enemy = this.state.enemies.get(message.targetId);

      if (!enemy || !enemy.alive) {
        this.rejectAction(client, "That target is no longer available.");
        return;
      }

      const abilityRange = getAbilityRangeForPlayer(player, ability);

      if (calculateDistance(player.x, player.y, enemy.x, enemy.y) > abilityRange) {
        this.rejectAction(client, "That target is out of ability range.");
        return;
      }

      player.actionUsed = true;
      this.addPublicLog(`${player.name} uses ${ability.name} on ${enemy.name}.`);

      const attackResolution = resolvePlayerAttackRoll(player, enemy.defense);
      this.addPublicLog(
        `Ability roll: d20 (${attackResolution.roll}) + ${player.attackBonus} = ${attackResolution.total} vs ${enemy.defense}.`
      );

      if (attackResolution.traitMessage) {
        this.addPublicLog(attackResolution.traitMessage);
      }

      if (!attackResolution.hit) {
        this.addPublicLog(`${ability.name} misses ${enemy.name}.`);
        this.syncState();
        this.publishSnapshots();
        return;
      }

      const damageTotal = calculateAbilityDamage(player, ability);
      enemy.hp = Math.max(0, enemy.hp - damageTotal);

      this.addPublicLog(`${ability.name} hits ${enemy.name}.`);
      this.addPublicLog(
        `${ability.name} deals ${damageTotal} damage. ${enemy.name} is now at ${enemy.hp}/${enemy.maxHp} HP.`
      );

      if (enemy.hp === 0) {
        enemy.alive = false;
        this.state.enemiesDefeated += 1;
        this.rewardExperience(enemy.name.includes("Chief") ? 10 : 5);
        this.addPublicLog(`${enemy.name} is defeated.`);

        if (!this.getLivingEnemies().length) {
          this.handleEncounterCompletion(player, enemy);
          return;
        }
      }

      this.syncState();
      this.publishSnapshots();
      return;
    }

    const targetPlayer = this.state.players.get(message.targetId);

    if (!targetPlayer || !targetPlayer.alive) {
      this.rejectAction(client, "That ally cannot be targeted right now.");
      return;
    }

    const abilityRange = getAbilityRangeForPlayer(player, ability);

    if (calculateDistance(player.x, player.y, targetPlayer.x, targetPlayer.y) > abilityRange) {
      this.rejectAction(client, "That ally is out of ability range.");
      return;
    }

    player.actionUsed = true;
    const healTotal = calculateHealingAmount(ability.healingDice);
    targetPlayer.health = Math.min(targetPlayer.maxHealth, targetPlayer.health + healTotal);
    targetPlayer.status = "alive";
    targetPlayer.alive = true;
    this.addPublicLog(`${player.name} uses ${ability.name} on ${targetPlayer.name}.`);
    this.addPublicLog(
      `${ability.name} restores ${healTotal} HP. ${targetPlayer.name} is now at ${targetPlayer.health}/${targetPlayer.maxHealth} HP.`
    );
    this.persistCharacterProfile(targetPlayer);
    this.syncState();
    this.publishSnapshots();
  }

  private handleEquipItemRequest(client: Client, message: EquipItemMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Equipment changes unlock once the session is live.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not equip player gear.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.getCurrentScene().sceneType === "encounter") {
      this.rejectAction(client, "Equipment can only be changed outside encounters.");
      return;
    }

    if (![...player.inventory].includes(message.itemId)) {
      this.rejectAction(client, "That item is not in your inventory.");
      return;
    }

    const item = itemsById.get(message.itemId);

    if (!item || !item.slot) {
      this.rejectAction(client, "That item cannot be equipped.");
      return;
    }

    if (item.slot === "weapon") {
      player.equippedWeapon = item.id;
    } else if (item.slot === "armor") {
      player.equippedArmor = item.id;
    }

    applyDerivedStatsToPlayer(player);
    this.addPublicLog(`${player.name} equips ${item.name}.`);
    this.persistCharacterProfile(player);
    this.syncState();
    this.publishSnapshots();
  }

  private handleUseItemRequest(client: Client, message: UseItemMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Items cannot be used until the session is live.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not use player items.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    const item = itemsById.get(message.itemId);

    if (!item || item.itemType !== "consumable") {
      this.rejectAction(client, "That item cannot be used.");
      return;
    }

    const inventoryIndex = [...player.inventory].findIndex((itemId) => itemId === item.id);

    if (inventoryIndex === -1) {
      this.rejectAction(client, "That item is not in your inventory.");
      return;
    }

    if (this.getCurrentScene().sceneType === "encounter") {
      if (!this.isPlayerTurn(client.sessionId)) {
        this.rejectAction(client, "It is not your turn.");
        return;
      }

      if (player.actionUsed) {
        this.rejectAction(client, "You already used your action this turn.");
        return;
      }
    }

    if (player.health >= player.maxHealth) {
      this.rejectAction(client, "You are already at full health.");
      return;
    }

    removeInventoryItem(player.inventory, inventoryIndex);
    const healTotal = calculateHealingAmount(item.healDice);
    player.health = Math.min(player.maxHealth, player.health + healTotal);
    player.status = "alive";
    player.alive = true;

    if (this.getCurrentScene().sceneType === "encounter") {
      player.actionUsed = true;
    }

    this.addPublicLog(
      `${player.name} drinks ${item.name} and restores ${healTotal} HP (${player.health}/${player.maxHealth}).`
    );
    this.persistCharacterProfile(player);
    this.syncState();
    this.publishSnapshots();
  }

  private handleEndTurn(client: Client) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Turns begin once the session launches.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not participate in turn order.");
      return;
    }

    if (!this.isPlayerTurn(client.sessionId)) {
      this.rejectAction(client, "Only the active player can end the turn.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (player) {
      this.addPublicLog(`${player.name} ended their turn.`);
    }

    this.advanceTurn();
  }

  private handleSceneAction(client: Client, message: SceneActionMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Story actions unlock once the session is live.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Use the Dungeon Master controls for story flow.");
      return;
    }

    if (!this.state.players.has(client.sessionId)) {
      return;
    }

    if (this.hasDungeonMaster()) {
      this.rejectAction(client, "The Dungeon Master controls story scenes in this room.");
      return;
    }

    switch (message.actionId) {
      case "accept_quest":
        this.addPublicLog("The party steps out from the starting area into the adventure map.");
        this.setMapFromDm("adventure");
        return;
      case "return_to_lobby":
        this.resetAdventure();
        return;
      default:
        return;
    }
  }

  private handlePurchaseRequest(client: Client, message: PurchaseMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Shopping is only available during live play.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not shop as player characters.");
      return;
    }

    const player = this.state.players.get(client.sessionId);
    const currentScene = this.getCurrentScene();

    if (!player) {
      return;
    }

    if (currentScene.sceneType !== "shop") {
      this.rejectAction(client, "Purchases can only be made in the merchant scene.");
      return;
    }

    const item = itemsById.get(message.itemId);

    if (!item || !merchantItemIds.includes(item.id)) {
      this.rejectAction(client, "That item is not for sale.");
      return;
    }

    if (player.gold < item.price) {
      this.rejectAction(client, "You do not have enough gold.");
      return;
    }

    player.gold -= item.price;
    player.inventory.push(item.id);
    this.recalculatePartyGold();

    this.addPublicLog(`${player.name} buys ${item.name} for ${item.price} gold.`);
    this.persistCharacterProfile(player);
    this.syncState();
    this.publishSnapshots();
  }

  private handleDynamicShopPurchase(client: Client, message: ShopPurchaseMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Shopping is only available during live play.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not shop as player characters.");
      return;
    }

    const player = this.state.players.get(client.sessionId);
    const shop = this.shops.get(message.shopId);

    if (!player) {
      return;
    }

    if (!shop) {
      this.rejectAction(client, "That shop does not exist.");
      return;
    }

    const entity = shop.linkedEntityId ? this.worldEntities.get(shop.linkedEntityId) : undefined;

    if (!entity || entity.mapKey !== this.currentMapKey || !isEntityVisibleToPlayers(entity)) {
      this.rejectAction(client, "That shop is not available here.");
      return;
    }

    if (calculateDistance(player.x, player.y, entity.x, entity.y) > 1) {
      this.rejectAction(client, "Move next to the shopkeeper to buy from this shop.");
      return;
    }

    const stockEntry = shop.inventory.find((entry) => entry.itemId === message.itemId);

    if (!stockEntry || stockEntry.stock <= 0) {
      this.rejectAction(client, "That item is not available.");
      return;
    }

    const item = itemsById.get(stockEntry.itemId);

    if (!item) {
      this.rejectAction(client, "That item definition is missing.");
      return;
    }

    const price = Math.max(0, stockEntry.price - Math.floor(stockEntry.price * (shop.discountPercent / 100)));

    if (player.gold < price) {
      this.rejectAction(client, "You do not have enough gold.");
      return;
    }

    player.gold -= price;
    player.inventory.push(item.id);
    stockEntry.stock -= 1;
    this.recalculatePartyGold();
    this.addPublicLog(`${player.name} buys ${item.name} from ${shop.name} for ${price} gold.`);
    this.addRewardHistory(`${player.name} purchased ${item.name} from ${shop.name}.`);
    this.persistCharacterProfile(player);
    this.syncState();
    this.publishSnapshots();
  }

  private handleSkillCheckRoll(client: Client, message: RollSkillCheckMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Skill checks are not active during preparation.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not roll player skill checks.");
      return;
    }

    const player = this.state.players.get(client.sessionId);
    const skillCheck = this.skillChecks.get(message.checkId);

    if (!player) {
      return;
    }

    if (!skillCheck) {
      this.rejectAction(client, "That skill check no longer exists.");
      return;
    }

    if (!skillCheck.targetPlayerIds.includes(client.sessionId)) {
      this.rejectAction(client, "That skill check is not assigned to you.");
      return;
    }

    if (skillCheck.results[client.sessionId]?.rolled) {
      this.rejectAction(client, "You have already rolled for that check.");
      return;
    }

    const roll = rollDie(20);
    const modifier = getSkillModifier(player, skillCheck.checkType);
    const total = roll + modifier;
    const success = total >= skillCheck.dc;
    const messageText = success ? skillCheck.successMessage : skillCheck.failureMessage;

    skillCheck.results[client.sessionId] = {
      rolled: true,
      roll,
      total,
      success,
      message: messageText
    };

    if (Object.values(skillCheck.results).every((result) => result.rolled)) {
      skillCheck.status = "completed";
    }

    const resultMessage = `${player.name} rolled ${capitalizeCheckType(skillCheck.checkType)}: d20 (${roll}) + ${modifier} = ${total} vs DC ${skillCheck.dc}. ${messageText}`;
    this.publishSkillCheckResult(skillCheck, player, resultMessage, success);

    if (success) {
      this.applyAutomationEffect(skillCheck.successEffect, player, skillCheck.title);
      if (skillCheck.linkedSecretId) {
        this.revealSecretRecord(skillCheck.linkedSecretId, `${player.name} uncovers a hidden clue.`);
      }
      if (skillCheck.successReward) {
        this.applyRewardGrant(skillCheck.successReward, `${player.name} succeeds on ${skillCheck.title}.`);
      }
    } else {
      this.applyAutomationEffect(skillCheck.failureEffect, player, skillCheck.title);
      if (skillCheck.failureReward) {
        this.applyRewardGrant(skillCheck.failureReward, `${player.name} fails ${skillCheck.title}.`);
      }
    }

    this.syncState();
    this.publishSnapshots();
  }

  private handleEntityInteraction(client: Client, message: InteractEntityMessage) {
    if (this.roomPhase !== "live") {
      this.rejectAction(client, "Interactive objects unlock once the session is live.");
      return;
    }

    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters configure interactions; players resolve them.");
      return;
    }

    const player = this.state.players.get(client.sessionId);
    const entity = message.entityId ? this.worldEntities.get(message.entityId) : undefined;

    if (!player || !entity || entity.mapKey !== this.currentMapKey || !isEntityVisibleToPlayers(entity)) {
      this.rejectAction(client, "That interaction is not available.");
      return;
    }

    if (calculateDistance(player.x, player.y, entity.x, entity.y) > 1) {
      this.rejectAction(client, "Move adjacent to interact with that object.");
      return;
    }

    if (!entity.interaction) {
      this.rejectAction(client, "That object does not have an interaction yet.");
      return;
    }

    const existing = [...this.skillChecks.values()].find((check) =>
      check.sourceEntityId === entity.id &&
      check.status === "pending" &&
      check.targetPlayerIds.includes(client.sessionId)
    );

    if (existing) {
      this.rejectAction(client, "That interaction is already waiting for your roll.");
      return;
    }

    this.createSkillCheckFromDm({
      tool: "createSkillCheck",
      checkType: entity.interaction.checkType,
      dc: entity.interaction.dc,
      title: entity.interaction.title,
      description: entity.interaction.description,
      target: "player",
      playerId: client.sessionId,
      visibility: entity.interaction.visibility,
      successMessage: entity.interaction.successText,
      failureMessage: entity.interaction.failureText,
      linkedSecretId: entity.interaction.successEffect.linkedSecretId,
      effectType: entity.interaction.successEffect.type,
      failureEffectType: entity.interaction.failureEffect.type,
      amount: entity.interaction.successEffect.reward?.amount,
      itemId: entity.interaction.successEffect.reward?.itemId,
      questId: entity.interaction.successEffect.questId,
      linkedShopId: entity.interaction.successEffect.linkedShopId,
      discountPercent: entity.interaction.successEffect.discountPercent,
      encounterId: entity.interaction.successEffect.encounterId,
      note: entity.interaction.successEffect.narration,
      sourceEntityId: entity.id
    } as DmToolMessage);
  }

  private handleCampService(client: Client, message: CampServiceMessage) {
    if (this.isDmSession(client.sessionId)) {
      this.rejectAction(client, "Dungeon Masters do not use camp services.");
      return;
    }

    const player = this.state.players.get(client.sessionId);

    if (!player) {
      return;
    }

    if (this.currentMapKey !== "camp") {
      this.rejectAction(client, "Camp services are only available while the party is at camp.");
      return;
    }

    if (message.serviceId === "heal") {
      player.health = player.maxHealth;
      player.status = "alive";
      player.alive = true;
      this.addPublicLog(`${player.characterName || player.name} rests at camp and fully recovers.`);
      this.persistCharacterProfile(player);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    if (message.serviceId === "revive") {
      if (this.campaignDifficulty === "legendary" && player.status === "permanentlyDead") {
        this.rejectAction(client, "Legendary mode permanent death cannot be reversed.");
        return;
      }

      if (player.status === "alive") {
        this.rejectAction(client, "That adventurer is already standing.");
        return;
      }

      player.status = "alive";
      player.alive = true;
      player.health = Math.max(1, Math.ceil(player.maxHealth / 2));
      this.addPublicLog(`${player.characterName || player.name} returns from the camp shrine restored.`);
      this.persistCharacterProfile(player);
      this.syncState();
      this.publishSnapshots();
    }
  }

  private handleDmAction(client: Client, message: DmActionMessage) {
    if (!this.requireDm(client)) {
      return;
    }

    switch (message.actionId) {
      case "startAdventure":
        this.launchAdventure();
        return;

      case "advanceScene":
        this.advanceSceneFromDm();
        return;

      case "previousScene":
        this.previousSceneFromDm();
        return;

      case "restartScene":
        this.restartCurrentSceneFromDm();
        return;

      case "setScene":
        this.setSceneFromDm(message.sceneId);
        return;

      case "spawnGoblin":
        this.spawnEnemyFromDm("goblin");
        return;

      case "spawnGoblinChief":
        this.spawnEnemyFromDm("goblin_chief");
        return;

      case "awardPartyGold":
        this.awardPartyGoldFromDm(message.amount);
        return;

      case "addPublicLogMessage":
        this.addNarrationFromDm(message.message);
        return;

      case "setMap":
        this.setMapFromDm(message.mapKey);
        return;

      case "completeSession":
        this.completeSessionFromDm();
        return;

      default:
        this.addDmLog("Unknown Dungeon Master action.");
        this.syncState();
        this.publishSnapshots();
    }
  }

  private handleDmTool(client: Client, message: DmToolMessage) {
    if (!this.requireDm(client)) {
        return;
    }

    switch (message.tool) {
        case "setMap":
          this.setMapFromDm(message.mapKey);
          return;
        case "setMapDefinition":
          this.setMapDefinitionFromDm(message.mapKey, message.mapId);
          return;
        case "setPlayerSpawn":
          this.setPlayerSpawnFromDm(message.playerId, message.mapKey, message.x, message.y);
          return;
        case "setPlayerStatus":
          this.setPlayerStatusFromDm(message.playerId, message.status);
          return;
        case "setCampaignDifficulty":
          this.setCampaignDifficultyFromDm(message.difficulty);
          return;
        case "saveTemplate":
          this.saveTemplateFromDm(message.templateName);
          return;
        case "loadTemplate":
          this.loadTemplateFromDm(message.templateName);
          return;
        case "resetPreparation":
          this.resetAdventure();
          return;
        case "createEncounterGroup":
          this.createEncounterGroupFromDm(message);
          return;
        case "activateEncounterGroup":
          this.activateEncounterGroupFromDm(message.encounterId);
          return;
        case "addSessionNote":
          this.addSessionNoteFromDm(message.note);
          return;
        case "createNpc":
          this.createNpcFromDm(message);
          return;
        case "placeEntity":
          this.placeEntityFromDm(message);
          return;
        case "setEntityVisibility":
          this.setEntityVisibilityFromDm(message.entityId, Boolean(message.visibleToPlayers));
          return;
        case "createShop":
          this.createShopFromDm(message);
          return;
        case "addShopItem":
          this.addShopItemFromDm(message);
          return;
        case "createQuest":
          this.createQuestFromDm(message);
          return;
        case "setQuestStatus":
          this.setQuestStatusFromDm(message.questId, normalizeQuestStatus(message.name));
          return;
        case "createSecret":
          this.createSecretFromDm(message);
          return;
        case "revealSecret":
          this.revealSecretRecord(message.secretId);
          this.syncState();
          this.publishSnapshots();
          return;
        case "createSkillCheck":
          this.createSkillCheckFromDm(message);
          return;
        case "giveReward":
          this.giveRewardFromDm(message);
          return;
        case "generateNpc":
          this.generateNpcTemplate();
          return;
        case "generateQuest":
          this.generateQuestTemplate();
          return;
        case "generateShop":
          this.generateShopTemplate();
          return;
        case "generateSecret":
          this.generateSecretTemplate();
          return;
        case "configureEntityInteraction":
          this.configureEntityInteractionFromDm(message);
          return;
        case "setEntityNotes":
          this.setEntityNotesFromDm(message.entityId, message.note);
          return;
        default:
          this.addDmLog("Unknown DM world tool.");
          this.syncState();
          this.publishSnapshots();
    }
  }

  private handleDmCommand(client: Client, message: DmCommandMessage) {
    if (!this.requireDm(client)) {
      return;
    }

    const rawCommand = message.command?.trim() ?? "";

    if (!rawCommand.startsWith("/")) {
      this.addDmLog("Use slash commands like /scene forest or /narrate The woods fall silent.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const commandParts = tokenizeCommand(rawCommand.slice(1).trim());
    const commandName = (commandParts[0] ?? "").toLowerCase();
    const subcommand = (commandParts[1] ?? "").toLowerCase();
    const argumentText = commandParts.slice(1).join(" ");

    switch (commandName) {
      case "scene":
        this.setSceneFromDm(argumentText, true);
        return;

      case "map":
        this.setMapFromDm(normalizeMapSlotKey(argumentText) ?? undefined, true);
        return;

      case "spawn":
        this.spawnEnemyFromDm(argumentText, true);
        return;

      case "gold":
        this.awardPartyGoldFromDm(Number(argumentText), true);
        return;

      case "narrate":
        this.addNarrationFromDm(argumentText, true);
        return;

      case "note":
        if (!argumentText) {
          this.addDmLog("Usage: /note <private note>");
        } else {
          this.addDmLog(`Note: ${argumentText}`);
          this.dmNotes.push({ id: buildRecordId("note", this.dmNotes.length + 1), message: argumentText });
        }
        this.syncState();
        this.publishSnapshots();
        return;

      case "shop":
        if (subcommand === "create") {
          this.createShopFromDm({ tool: "createShop", name: commandParts.slice(2).join(" ") });
          return;
        }

        if (subcommand === "additem") {
          this.addShopItemFromDm({
            tool: "addShopItem",
            ...(commandParts[2] ? { shopId: commandParts[2] } : {}),
            ...(commandParts[3] ? { itemId: commandParts[3] } : {}),
            price: Number(commandParts[4] ?? 0),
            stock: Number(commandParts[5] ?? 1)
          });
          return;
        }

        this.setShopFromDm(argumentText);
        return;

      case "victory":
        this.setSceneFromDm("victory", true);
        return;

      case "npc":
        if (subcommand === "create") {
          this.createNpcFromDm({
            tool: "createNpc",
            ...(commandParts[2] ? { name: commandParts[2] } : {}),
            role: commandParts.slice(3).join(" ") || "wanderer"
          });
          return;
        }

        if (subcommand === "place") {
          this.placeEntityFromDm({
            tool: "placeEntity",
            ...(commandParts[2] ? { npcId: commandParts[2] } : {}),
            entityType: "npc",
            x: Number(commandParts[3]),
            y: Number(commandParts[4]),
            visibleToPlayers: false
          });
          return;
        }
        break;

      case "quest":
        if (subcommand === "create") {
          this.createQuestFromDm({
            tool: "createQuest",
            title: commandParts.slice(2).join(" "),
            objective: commandParts.slice(2).join(" "),
            rewardGold: 5
          });
          return;
        }

        if (subcommand === "offer") {
          this.setQuestStatusFromDm(commandParts[2], "offered");
          return;
        }

        if (subcommand === "complete") {
          this.setQuestStatusFromDm(commandParts[2], "completed");
          return;
        }
        break;

      case "secret":
        if (subcommand === "create") {
          this.createSecretFromDm({
            tool: "createSecret",
            checkType: normalizeSkillCheckType(commandParts[2]),
            dc: Number(commandParts[3]),
            description: commandParts.slice(4).join(" ")
          });
          return;
        }

        if (subcommand === "reveal") {
          this.revealSecretRecord(commandParts[2]);
          this.syncState();
          this.publishSnapshots();
          return;
        }
        break;

      case "check": {
        const checkType = normalizeSkillCheckType(commandParts[1]);
        const dc = Number(commandParts[2]);
        const targetToken = commandParts[3] ?? "party";
        const title = commandParts.slice(4).join(" ") || `${capitalizeCheckType(checkType)} check`;
        this.createSkillCheckFromDm({
          tool: "createSkillCheck",
          checkType,
          dc,
          title,
          target: targetToken === "all" || targetToken === "party" ? targetToken : "player",
          playerName: targetToken,
          visibility: "targeted"
        });
        return;
      }

      case "give":
        if (subcommand === "gold") {
          this.giveRewardFromDm({
            tool: "giveReward",
            name: "gold",
            target: "party",
            amount: Number(commandParts[2])
          });
          return;
        }

        if (subcommand === "item") {
          this.giveRewardFromDm({
            tool: "giveReward",
            name: "item",
            ...(commandParts[2] ? { playerName: commandParts[2] } : {}),
            ...(commandParts[3] ? { itemId: commandParts[3] } : {})
          });
          return;
        }
        break;

      case "reveal":
        this.setEntityVisibilityFromDm(commandParts[1], true);
        return;

      case "hide":
        this.setEntityVisibilityFromDm(commandParts[1], false);
        return;

    }

    this.addDmLog(`Unknown command: ${rawCommand}`);
    this.syncState();
    this.publishSnapshots();
  }

  private handleEncounterCompletion(attacker: PlayerState, defeatedEnemy: EnemyState) {
    const currentScene = this.getCurrentScene();
    appendUniqueString(this.state.completedEncounters, currentScene.id);
    this.addPublicLog(`${currentScene.title} encounter complete.`);
    this.restoreDownedPlayersAfterEncounter();

    if (this.hasDungeonMaster()) {
      if (this.currentMapKey === "adventure") {
        this.rewardGold(5, "Goblin defeated. Party gains 5 gold.");
        this.rewardExperience(50);
        this.addDmLog("Adventure encounter complete. Move the party onward when ready.");
      } else if (this.currentMapKey === "boss") {
        this.rewardGold(20, "Goblin Chief defeated. Party gains 20 gold.");
        this.rewardExperience(100);
        attacker.inventory.push("iron_sword");
        this.addPublicLog(`${attacker.name} receives an Iron Sword.`);
        this.addDmLog("Boss encounter complete. Move the party to camp or complete the session when ready.");
      }

      if (!this.isPlayerTurn(attacker.id)) {
        this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? attacker.id);
      }
      this.syncState();
      this.publishSnapshots();
      return;
    }

    if (this.currentMapKey === "adventure") {
      this.rewardGold(5, "Goblin defeated. Party gains 5 gold.");
      this.rewardExperience(50);
      this.setMapFromDm("boss");
      return;
    }

    if (this.currentMapKey === "boss") {
      this.rewardGold(20, "Goblin Chief defeated. Party gains 20 gold.");
      this.rewardExperience(100);
      attacker.inventory.push("iron_sword");
      this.addPublicLog(`${attacker.name} receives an Iron Sword.`);
      this.completeSessionFromDm();
      return;
    }

    this.syncState();
    this.publishSnapshots();
  }

  private createNpcFromDm(message: DmToolMessage) {
    const name = sanitizeWorldName(message.name, "Mysterious Figure");
    const npcId = buildRecordId("npc", this.npcs.size + 1);
    const npc: NpcRecord = {
      id: npcId,
      name,
      role: sanitizeWorldName(message.role, "wanderer"),
      personality: sanitizeWorldText(message.description, "Calm and observant."),
      publicDescription: sanitizeWorldText(message.publicDescription, `${name} watches the party carefully.`),
      privateNotes: sanitizeWorldText(message.privateNotes, "No hidden notes yet."),
      dialoguePrompt: sanitizeWorldText(message.dialoguePrompt, `Ask ${name} about the area.`),
      questHooks: sanitizeWorldText(message.questHooks, "No quest hook assigned yet."),
      linkedEntityId: undefined
    };

    this.npcs.set(npcId, npc);
    this.addDmLog(`Created NPC ${npc.name} (${npc.id}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private placeEntityFromDm(message: DmToolMessage) {
    const entityType = message.entityType ?? "npc";
    const mapKey = message.mapKey ?? this.currentMapKey;
    const x = Number(message.x);
    const y = Number(message.y);

    if (!isWholeNumber(x) || !isWholeNumber(y)) {
      this.addDmLog("Choose valid map coordinates to place an entity.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    if (x < 0 || y < 0 || x >= this.state.gridWidth || y >= this.state.gridHeight) {
      this.addDmLog("That entity position is outside the current map.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    let name = sanitizeWorldName(message.name, formatEntityTypeLabel(entityType));
    let description = sanitizeWorldText(message.description, `${name} stands here.`);
    let linkedNpcId = message.npcId;
    let linkedShopId = message.shopId;

    if ((entityType === "npc" || entityType === "shopkeeper") && linkedNpcId) {
      const npc = this.npcs.get(linkedNpcId);

      if (!npc) {
        this.addDmLog(`Unknown NPC: ${linkedNpcId}`);
        this.syncState();
        this.publishSnapshots();
        return;
      }

      name = npc.name;
      description = npc.publicDescription;
    }

    const entityId = buildRecordId("entity", this.worldEntities.size + 1);
    const entity: WorldEntityRecord = {
      id: entityId,
      mapKey,
      type: entityType,
      name,
      description,
      dmNotes: sanitizeWorldText(message.note, ""),
      x,
      y,
      visibilityState: message.visibilityState ?? (message.visibleToPlayers ? "visible" : "hidden"),
      discovered: Boolean(message.discovered) || message.visibilityState === "revealed",
      linkedQuestId: message.linkedQuestId,
      linkedShopId,
      linkedItemId: message.linkedItemId,
      linkedNpcId,
      linkedSecretId: message.linkedSecretId,
      interaction: undefined
    };

    this.worldEntities.set(entityId, entity);

    if (linkedNpcId) {
      const npc = this.npcs.get(linkedNpcId);

      if (npc) {
        npc.linkedEntityId = entityId;
      }
    }

    if (linkedShopId) {
      const shop = this.shops.get(linkedShopId);

      if (shop) {
        shop.linkedEntityId = entityId;
      }
    }

    this.addDmLog(`Placed ${entity.name} at (${x + 1}, ${y + 1}) as ${entity.id}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private setEntityVisibilityFromDm(entityId: string | undefined, visibleToPlayers: boolean) {
    this.setEntityVisibilityStateFromDm(entityId, visibleToPlayers ? "revealed" : "hidden");
  }

  private setEntityVisibilityStateFromDm(entityId: string | undefined, visibilityState: VisibilityState) {
    const entity = entityId ? this.worldEntities.get(entityId) : undefined;

    if (!entity) {
      this.addDmLog(`Unknown entity: ${entityId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    entity.visibilityState = visibilityState;
    if (visibilityState === "revealed" || visibilityState === "visible") {
      entity.discovered = true;
    }

    this.addDmLog(`${visibilityState === "hidden" ? "Hid" : "Updated"} ${entity.name} (${visibilityState}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private setEntityNotesFromDm(entityId: string | undefined, note: string | undefined) {
    const entity = entityId ? this.worldEntities.get(entityId) : undefined;

    if (!entity) {
      this.addDmLog(`Unknown entity: ${entityId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    entity.dmNotes = sanitizeWorldText(note, "");
    this.addDmLog(`Updated DM notes for ${entity.name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private configureEntityInteractionFromDm(message: DmToolMessage) {
    const entity = message.entityId ? this.worldEntities.get(message.entityId) : undefined;

    if (!entity) {
      this.addDmLog(`Unknown entity: ${message.entityId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    entity.interaction = {
      title: sanitizeWorldText(message.interactionTitle, `${entity.name} interaction`),
      description: sanitizeWorldText(message.description, `Interact with ${entity.name}.`),
      checkType: normalizeSkillCheckType(message.checkType),
      dc: Math.max(1, Math.floor(message.dc ?? 10)),
      targetMode: message.targetPlayerMode ?? "single",
      visibility: message.visibility ?? "targeted",
      successText: sanitizeWorldText(message.successMessage, "Success."),
      failureText: sanitizeWorldText(message.failureMessage, "Failure."),
      successEffect: buildAutomationEffect(message, "success"),
      failureEffect: buildAutomationEffect(message, "failure")
    };

    if (message.note !== undefined) {
      entity.dmNotes = sanitizeWorldText(message.note, entity.dmNotes ?? "");
    }

    this.addDmLog(`Configured interaction for ${entity.name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private createShopFromDm(message: DmToolMessage) {
    const name = sanitizeWorldName(message.name, "Traveling Trader");
    const shopId = buildRecordId("shop", this.shops.size + 1);
    const npc = message.npcId ? this.npcs.get(message.npcId) : this.getLatestNpc();
    const shop: ShopRecord = {
      id: shopId,
      name,
      shopkeeperNpcId: npc?.id,
      linkedEntityId: undefined,
      inventory: [],
      discountPercent: 0
    };

    this.shops.set(shopId, shop);

    if (npc) {
      const existingEntity = npc.linkedEntityId ? this.worldEntities.get(npc.linkedEntityId) : undefined;

      if (existingEntity) {
        existingEntity.type = "shopkeeper";
        existingEntity.linkedShopId = shopId;
        shop.linkedEntityId = existingEntity.id;
      }
    }

    this.addDmLog(`Created shop ${shop.name} (${shop.id}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private addShopItemFromDm(message: DmToolMessage) {
    const shop = message.shopId ? this.shops.get(message.shopId) : undefined;
    const item = message.itemId ? itemsById.get(message.itemId) : undefined;

    if (!shop) {
      this.addDmLog(`Unknown shop: ${message.shopId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    if (!item) {
      this.addDmLog(`Unknown item: ${message.itemId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const stock = Math.max(1, Math.floor(message.stock ?? 1));
    const price = Math.max(1, Math.floor(message.price ?? item.price));
    const existing = shop.inventory.find((entry) => entry.itemId === item.id);

    if (existing) {
      existing.price = price;
      existing.stock += stock;
    } else {
      shop.inventory.push({ itemId: item.id, price, stock });
    }

    this.addDmLog(`Added ${item.name} to ${shop.name} for ${price} gold (${stock} stock).`);
    this.syncState();
    this.publishSnapshots();
  }

  private createQuestFromDm(message: DmToolMessage) {
    const title = sanitizeWorldName(message.title, "Unfinished Business");
    const questId = buildRecordId("quest", this.quests.size + 1);
    const quest: QuestRecord = {
      id: questId,
      title,
      publicObjective: sanitizeWorldText(message.objective, title),
      privateNotes: sanitizeWorldText(message.privateNotes, "No private quest notes yet."),
      rewardGold: Math.max(0, Math.floor(message.rewardGold ?? 0)),
      rewardItems: (message.rewardItems ?? []).filter(Boolean),
      completionCondition: sanitizeWorldText(message.description, "Resolve this task in play."),
      status: "hidden",
      assignedTo: message.assignTo ?? "party"
    };

    this.quests.set(questId, quest);
    this.addDmLog(`Created quest ${quest.title} (${quest.id}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private setQuestStatusFromDm(questId: string | undefined, status: QuestStatus) {
    const quest = questId ? this.quests.get(questId) : undefined;

    if (!quest) {
      this.addDmLog(`Unknown quest: ${questId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    quest.status = status;

    if (status === "offered") {
      this.addPublicLog(`New quest offered: ${quest.title}. ${quest.publicObjective}`);
    } else if (status === "completed") {
      this.addPublicLog(`Quest complete: ${quest.title}.`);
      for (const player of this.state.players.values()) {
        appendUniqueString(player.completedQuestIds, quest.id);
        this.persistCharacterProfile(player);
      }
      if (quest.rewardGold > 0) {
        this.rewardGold(quest.rewardGold, `${quest.title} rewards ${quest.rewardGold} gold.`);
      }

      for (const rewardItemId of quest.rewardItems) {
        this.grantItemToTargets(rewardItemId, quest.assignedTo === "party" ? undefined : [quest.assignedTo]);
      }
    }

    this.addDmLog(`Quest ${quest.title} is now ${status}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private createSecretFromDm(message: DmToolMessage) {
    const checkType = normalizeSkillCheckType(message.checkType);
    const dc = Math.max(1, Math.floor(message.dc ?? 10));
    const revealText = sanitizeWorldText(message.description, "A hidden detail is revealed.");
    const secretId = buildRecordId("secret", this.secrets.size + 1);
    const secret: SecretRecord = {
      id: secretId,
      mapKey: message.mapKey ?? this.currentMapKey,
      checkType,
      dc,
      revealText,
      privateNotes: sanitizeWorldText(message.privateNotes, "No extra secret notes."),
      revealed: false,
      linkedEntityId: message.linkedEntityId,
      unlockMapKey: undefined
    };

    this.secrets.set(secretId, secret);

    if (message.linkedEntityId) {
      const entity = this.worldEntities.get(message.linkedEntityId);

      if (entity) {
        entity.linkedSecretId = secretId;
      }
    }

    this.addDmLog(`Created secret ${secret.id} (${capitalizeCheckType(checkType)} DC ${dc}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private revealSecretRecord(secretId: string | undefined, sourceMessage?: string) {
    const secret = secretId ? this.secrets.get(secretId) : undefined;

    if (!secret) {
      this.addDmLog(`Unknown secret: ${secretId ?? ""}`);
      return;
    }

    if (secret.revealed) {
      this.addDmLog(`${secret.id} is already revealed.`);
      return;
    }

    secret.revealed = true;
    this.addPublicLog(secret.revealText);
    this.addRewardHistory(secret.revealText);

    if (sourceMessage) {
      this.addDmLog(sourceMessage);
    }

    if (secret.linkedEntityId) {
      const entity = this.worldEntities.get(secret.linkedEntityId);

      if (entity) {
        entity.visibilityState = "revealed";
        entity.discovered = true;
      }
    }
  }

  private createSkillCheckFromDm(message: DmToolMessage) {
    const checkType = normalizeSkillCheckType(message.checkType);
    const dc = Math.max(1, Math.floor(message.dc ?? 10));
    const targetPlayerIds = resolveTargetPlayerIds(
      this.state.players,
      message.target ?? "party",
      message.playerId,
      message.playerName,
      message.targetPlayerIds
    );

    if (!targetPlayerIds.length) {
      this.addDmLog("Choose at least one player for the skill check.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const checkId = buildRecordId("check", this.skillChecks.size + 1);
    const results = Object.fromEntries(
      targetPlayerIds.map((playerId) => [
        playerId,
        { rolled: false, roll: 0, total: 0, success: false, message: "" }
      ])
    ) as Record<string, SkillCheckResult>;

    const skillCheck: SkillCheckRecord = {
      id: checkId,
      title: sanitizeWorldText(message.title, `${capitalizeCheckType(checkType)} check`),
      description: sanitizeWorldText(message.description, "Roll to resolve the situation."),
      checkType,
      dc,
      targetPlayerIds,
      visibility: message.visibility ?? "targeted",
      successMessage: sanitizeWorldText(message.successMessage, "Success."),
      failureMessage: sanitizeWorldText(message.failureMessage, "Failure."),
      status: "pending",
      results,
      linkedSecretId: message.linkedSecretId,
      successReward: undefined,
      failureReward: undefined,
      successEffect: buildAutomationEffect(message, "success"),
      failureEffect: buildAutomationEffect(message, "failure"),
      sourceEntityId: message.sourceEntityId
    };

    this.skillChecks.set(checkId, skillCheck);
    this.addDmLog(`Created ${skillCheck.title} (${skillCheck.id}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private giveRewardFromDm(message: DmToolMessage) {
    const rewardType = normalizeRewardType(message.name);

    if (!rewardType) {
      this.addDmLog("Choose a valid reward type.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const targetPlayerIds = resolveTargetPlayerIds(
      this.state.players,
      message.target ?? "party",
      message.playerId,
      message.playerName
    );

    this.applyRewardGrant(
      {
        type: rewardType,
        amount: message.amount,
        itemId: message.itemId,
        questId: message.questId,
        targetPlayerIds
      },
      "The Dungeon Master grants a reward."
    );
    this.syncState();
    this.publishSnapshots();
  }

  private generateNpcTemplate() {
    const index = this.generatorIndex++;
    const templates = [
      ["Tamsin", "scout", "Quick, bright, and suspicious."],
      ["Bram", "merchant", "Friendly until money is involved."],
      ["Sera", "guide", "Patient, practical, and watchful."]
    ] as const;
    const [name, role, personality] = templates[index % templates.length] ?? templates[0];
    this.createNpcFromDm({
      tool: "createNpc",
      name,
      role,
      description: personality,
      publicDescription: `${name} the ${role} seems ready to talk.`,
      privateNotes: `${name} is hiding something useful from the party.`,
      dialoguePrompt: `Ask ${name} what they know about the road ahead.`,
      questHooks: `${name} points toward trouble deeper in the woods.`
    });
  }

  private generateQuestTemplate() {
    const index = this.generatorIndex++;
    const title = ["Lost Caravan", "Missing Scout", "Sealed Cellar"][index % 3] ?? "Lost Caravan";
    this.createQuestFromDm({
      tool: "createQuest",
      title,
      objective: `Resolve the ${title.toLowerCase()} problem.`,
      privateNotes: "Use this as a lightweight side objective.",
      rewardGold: 8
    });
  }

  private generateShopTemplate() {
    const index = this.generatorIndex++;
    const latestNpcId = this.getLatestNpc()?.id;
    this.createShopFromDm({
      tool: "createShop",
      name: `Camp Supply ${index + 1}`,
      ...(latestNpcId ? { npcId: latestNpcId } : {})
    });
  }

  private generateSecretTemplate() {
    this.createSecretFromDm({
      tool: "createSecret",
      checkType: "perception",
      dc: 14,
      description: "A scuffed stone slides aside to reveal a narrow hidden passage."
    });
  }

  private setSceneFromDm(sceneId: string | undefined, fromCommand = false) {
    const normalizedSceneId = sceneId?.trim().toLowerCase() ?? "";
    const nextScene = scenesById.get(normalizedSceneId);

    if (!nextScene) {
      this.addDmLog(fromCommand ? `Unknown scene: ${sceneId ?? ""}` : "Choose a valid scene.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    if (nextScene.id !== "tavern") {
      if (!this.allPlayersConfirmed()) {
        this.addDmLog("All players must confirm their race and class before the adventure begins.");
        this.syncState();
        this.publishSnapshots();
        return;
      }
      this.ensureAdventureStarted();
    }

    if (nextScene.id === "victory") {
      this.state.adventureCompletedAt = new Date().toISOString();
    }

    const narration =
      nextScene.id === "forest" && this.getCurrentScene().id === "tavern"
        ? "The Dungeon Master leads the party from the tavern to the forest road."
        : `The Dungeon Master shifts the story to ${nextScene.title}.`;

    this.transitionToScene(nextScene.id, narration);
  }

  private advanceSceneFromDm() {
    const currentIndex = orderedSceneIds.indexOf(this.state.currentSceneId);
    const nextSceneId =
      currentIndex === -1
        ? orderedSceneIds[0]
        : orderedSceneIds[Math.min(currentIndex + 1, orderedSceneIds.length - 1)];

    if (!nextSceneId) {
      this.addDmLog("No later scene is available.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.setSceneFromDm(nextSceneId);
  }

  private previousSceneFromDm() {
    const currentIndex = orderedSceneIds.indexOf(this.state.currentSceneId);
    const previousSceneId =
      currentIndex <= 0 ? orderedSceneIds[0] : orderedSceneIds[currentIndex - 1];

    if (!previousSceneId) {
      this.addDmLog("No earlier scene is available.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.setSceneFromDm(previousSceneId);
  }

  private restartCurrentSceneFromDm() {
    const currentScene = this.getCurrentScene();
    this.transitionToScene(currentScene.id, `${currentScene.title} is reset by the Dungeon Master.`);
  }

  private setShopFromDm(shopId: string) {
    const normalizedShopId = shopId.trim().toLowerCase();

    if (normalizedShopId !== "merchant" && normalizedShopId !== "traveling_merchant") {
      this.addDmLog(`Unknown shop: ${shopId}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.setSceneFromDm("merchant", true);
  }

  private addNarrationFromDm(message: string | undefined, fromCommand = false) {
    const narration = message?.trim() ?? "";

    if (!narration) {
      this.addDmLog(fromCommand ? "Usage: /narrate <message>" : "Enter a public message to add to the log.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.addPublicLog(narration);
    this.syncState();
    this.publishSnapshots();
  }

  private awardPartyGoldFromDm(amount: number | undefined, fromCommand = false) {
    if (!Number.isFinite(amount) || amount === undefined || amount <= 0) {
      this.addDmLog(fromCommand ? "Usage: /gold <positive amount>" : "Enter a positive gold amount.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.rewardGold(Math.floor(amount), `The party gains ${Math.floor(amount)} gold.`);
    this.addDmLog(`Awarded ${Math.floor(amount)} gold to the party.`);
    this.syncState();
    this.publishSnapshots();
  }

  private spawnEnemyFromDm(enemyId: string | undefined, fromCommand = false) {
    const normalizedEnemyId = enemyId?.trim().toLowerCase() ?? "";

    if (!normalizedEnemyId) {
      this.addDmLog(fromCommand ? "Usage: /spawn <enemyId>" : "Choose an enemy to spawn.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    if (this.getCurrentScene().sceneType !== "encounter") {
      this.addDmLog("Enemies can only be spawned during encounter scenes.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const definition = enemiesById.get(normalizedEnemyId);

    if (!definition) {
      this.addDmLog(`Unknown enemy: ${enemyId}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const enemy = this.createEnemyState(definition, this.getNextEnemySpawnPoint());
    this.state.enemies.set(enemy.id, enemy);
    this.addDmLog(`Spawned ${enemy.name} as ${enemy.id}.`);
    this.ensureEncounterTurnStarted();
    this.syncState();
    this.publishSnapshots();
  }

  private transitionToScene(sceneId: string, transitionMessage?: string) {
    const nextScene = scenesById.get(sceneId);
    const nextMapKey = mapKeyFromSceneId(sceneId);

    if (!nextScene) {
      return;
    }

    if (transitionMessage) {
      this.addPublicLog(transitionMessage);
    }

    if (sceneId === "victory" && !this.state.adventureCompletedAt) {
      this.state.adventureCompletedAt = new Date().toISOString();
      this.roomPhase = "completed";
      this.completeAdventureProgress();
    }

    this.applyMapState(nextMapKey);
    this.addPublicLog(`Scene transition: ${nextScene.title}.`);
    this.syncState();
    this.publishSnapshots();
  }


  private applySceneState(sceneId: string) {
    this.applyMapState(mapKeyFromSceneId(sceneId));
  }

  private applyMapState(mapKey: MapSlotKey, options: { encounterOnEnter?: boolean } = {}) {
    const sessionMap = this.getSessionMap(mapKey);
    const map = mapsById.get(sessionMap.mapId) ?? defaultMapDefinition();

    this.currentMapKey = mapKey;
    this.state.currentSceneId = sceneIdFromMapKey(mapKey);
    this.state.gridWidth = map.width;
    this.state.gridHeight = map.height;
    this.clearEnemies();
    this.clearActiveTurn();
    this.repositionPlayers();
    this.resetEncounterFlags();

    const liveEncounter = this.roomPhase === "live" && (mapKey === "adventure" || mapKey === "boss");

    if (liveEncounter && options.encounterOnEnter !== false) {
      this.spawnConfiguredEncounter(this.state.currentSceneId);
      this.activateMapEncounterGroups(mapKey);
      this.ensureEncounterTurnStarted();
    }
  }

  private spawnConfiguredEncounter(sceneId: string) {
    const spawns = encounterSpawnBySceneId[sceneId] ?? [];

    for (const spawn of spawns) {
      const definition = enemiesById.get(spawn.enemyId);

      if (!definition) {
        continue;
      }

      const enemy = this.createEnemyState(definition, spawn.position);
      this.state.enemies.set(enemy.id, enemy);
    }
  }

  private createEnemyState(definition: EnemyDefinition, position: Point) {
    const enemy = new EnemyState();
    enemy.id = this.buildEnemyInstanceId(definition.id);
    enemy.name = definition.name;
    enemy.hp = definition.health;
    enemy.maxHp = definition.health;
    enemy.defense = definition.armorClass;
    enemy.x = position.x;
    enemy.y = position.y;
    enemy.movement = definition.movement;
    enemy.attackBonus = definition.attacks[0]?.toHit ?? 2;
    enemy.damageDice = definition.attacks[0]?.damage ?? "1d4+1";
    enemy.alive = true;
    return enemy;
  }

  private buildEnemyInstanceId(enemyId: string) {
    let nextIndex = 1;

    while (this.state.enemies.has(`${enemyId}-${nextIndex}`)) {
      nextIndex += 1;
    }

    return `${enemyId}-${nextIndex}`;
  }

  private getNextEnemySpawnPoint() {
    const livingPlayers = this.getLivingPlayers();

    if (livingPlayers.length && livingPlayers[0]) {
      const anchor = livingPlayers[0];
      const candidates: Point[] = [
        { x: Math.min(this.state.gridWidth - 1, anchor.x + 1), y: anchor.y },
        { x: anchor.x, y: Math.max(0, anchor.y - 1) },
        { x: Math.min(this.state.gridWidth - 1, anchor.x + 2), y: anchor.y },
        { x: anchor.x, y: Math.min(this.state.gridHeight - 1, anchor.y + 1) }
      ];

      for (const candidate of candidates) {
        if (!this.isOccupiedByLivingUnit(candidate.x, candidate.y)) {
          return candidate;
        }
      }
    }

    for (let y = 0; y < this.state.gridHeight; y += 1) {
      for (let x = 0; x < this.state.gridWidth; x += 1) {
        if (!this.isOccupiedByLivingUnit(x, y)) {
          return { x, y };
        }
      }
    }

    return {
      x: Math.max(0, this.state.gridWidth - 1),
      y: 0
    };
  }

  private rewardGold(amount: number, message: string) {
    const recipients = [...this.state.players.values()];

    if (!recipients.length) {
      return;
    }

    const baseShare = Math.floor(amount / recipients.length);
    let remainder = amount % recipients.length;

    for (const player of recipients) {
      const share = baseShare + (remainder > 0 ? 1 : 0);
      player.gold += share;
      this.persistCharacterProfile(player);
      if (remainder > 0) {
        remainder -= 1;
      }
    }

    this.state.totalGoldEarned += amount;
    this.recalculatePartyGold();
    this.addPublicLog(message);
  }

  private rewardExperience(amount: number) {
    for (const player of this.state.players.values()) {
      player.xp += amount;
      player.level = calculateLevelFromXp(player.xp);
      applyDerivedStatsToPlayer(player, { healToFull: false, resetTurnResources: false });
      this.persistCharacterProfile(player);
    }
  }

  private grantItemToTargets(itemId: string, targetPlayerIds?: string[]) {
    const item = itemsById.get(itemId);

    if (!item) {
      return;
    }

    const targets = targetPlayerIds?.length
      ? targetPlayerIds.map((playerId) => this.state.players.get(playerId)).filter((player): player is PlayerState => player !== undefined)
      : [...this.state.players.values()];

    for (const player of targets) {
      player.inventory.push(item.id);
      this.persistCharacterProfile(player);
    }

    if (targets.length) {
      this.addPublicLog(`${targets.map((player) => player.name).join(", ")} receive ${item.name}.`);
      this.addRewardHistory(`${item.name} granted to ${targets.map((player) => player.name).join(", ")}.`);
    }
  }

  private applyRewardGrant(reward: RewardGrant, sourceMessage: string) {
    const targetPlayerIds = reward.targetPlayerIds?.length ? reward.targetPlayerIds : [...this.state.players.keys()];
    const targets = targetPlayerIds
      .map((playerId) => this.state.players.get(playerId))
      .filter((player): player is PlayerState => player !== undefined);

    if (!targets.length) {
      return;
    }

    switch (reward.type) {
      case "gold": {
        const amount = Math.max(0, Math.floor(reward.amount ?? 0));

        for (const player of targets) {
          player.gold += amount;
          this.persistCharacterProfile(player);
        }

        this.recalculatePartyGold();
        this.addPublicLog(`${sourceMessage} ${targets.map((player) => player.name).join(", ")} gain ${amount} gold.`);
        this.addRewardHistory(`${amount} gold granted to ${targets.map((player) => player.name).join(", ")}.`);
        return;
      }

      case "item":
        if (reward.itemId) {
          this.grantItemToTargets(reward.itemId, targetPlayerIds);
        }
        return;

      case "xp": {
        const amount = Math.max(0, Math.floor(reward.amount ?? 0));

        for (const player of targets) {
          player.xp += amount;
          player.level = calculateLevelFromXp(player.xp);
          applyDerivedStatsToPlayer(player, { healToFull: false, resetTurnResources: false });
          this.persistCharacterProfile(player);
        }

        this.addPublicLog(`${sourceMessage} ${targets.map((player) => player.name).join(", ")} gain ${amount} XP.`);
        this.addRewardHistory(`${amount} XP granted to ${targets.map((player) => player.name).join(", ")}.`);
        return;
      }

      case "healing": {
        const amount = Math.max(0, Math.floor(reward.amount ?? 0));

        for (const player of targets) {
          player.health = Math.min(player.maxHealth, player.health + amount);
          if (player.health > 0) {
            player.status = "alive";
            player.alive = true;
          }
          this.persistCharacterProfile(player);
        }

        this.addPublicLog(`${sourceMessage} ${targets.map((player) => player.name).join(", ")} recover ${amount} HP.`);
        this.addRewardHistory(`${amount} healing granted to ${targets.map((player) => player.name).join(", ")}.`);
        return;
      }

      case "quest_progress":
        if (reward.questId) {
          this.setQuestStatusFromDm(reward.questId, "active");
        }
        return;
    }
  }

  private applyAutomationEffect(effect: AutomationEffect | undefined, player: PlayerState, sourceTitle: string) {
    if (!effect || effect.type === "none") {
      return;
    }

    switch (effect.type) {
      case "reveal_secret":
        this.revealSecretRecord(effect.linkedSecretId, `${player.name} reveals a secret through ${sourceTitle}.`);
        return;
      case "reward":
        if (effect.reward) {
          this.applyRewardGrant(effect.reward, `${player.name} resolves ${sourceTitle}.`);
        }
        return;
      case "quest_progress":
        if (effect.questId) {
          this.setQuestStatusFromDm(effect.questId, "completed");
        }
        return;
      case "shop_discount":
        if (effect.linkedShopId) {
          const shop = this.shops.get(effect.linkedShopId);
          if (shop) {
            shop.discountPercent = Math.max(shop.discountPercent, effect.discountPercent ?? 15);
            this.addPublicLog(`${shop.name} offers a ${shop.discountPercent}% discount after ${player.name}'s success.`);
          }
        }
        return;
      case "trigger_event":
      case "narration":
        if (effect.narration) {
          this.addPublicLog(effect.narration);
        }
        return;
      case "trigger_combat":
        if (effect.encounterId) {
          this.activateEncounterGroupFromDm(effect.encounterId);
        }
        return;
    }
  }

  private publishSkillCheckResult(
    skillCheck: SkillCheckRecord,
    player: PlayerState,
    resultMessage: string,
    success: boolean
  ) {
    if (skillCheck.visibility === "public") {
      this.addPublicLog(resultMessage);
    } else if (skillCheck.visibility === "targeted") {
      this.addPublicLog(`${player.name} resolves ${skillCheck.title}.`);
      this.addDmLog(resultMessage);
    } else {
      this.addDmLog(resultMessage);
    }

    if (success && skillCheck.linkedSecretId) {
      this.addDmLog(`${player.name} succeeded and can reveal ${skillCheck.linkedSecretId}.`);
    }
  }

  private addRewardHistory(message: string) {
    this.rewardHistory.push({ id: buildRecordId("reward", this.rewardHistory.length + 1), message });

    if (this.rewardHistory.length > maxLogEntries) {
      this.rewardHistory.shift();
    }
  }

  private getLatestNpc() {
    return [...this.npcs.values()].at(-1);
  }

  private persistCharacterProfile(player: PlayerState) {
    const ownerKey = normalizeProfileOwner(player.name);
    const existingProfiles = persistentCharacterProfiles.get(ownerKey) ?? [];
    const nextProfile: PersistentCharacterRecord = {
      id: player.profileId || buildRecordId("profile", existingProfiles.length + 1),
      ownerName: player.name,
      name: player.characterName || `${player.name} ${player.className}`.slice(0, 24),
      raceId: player.raceId,
      raceName: player.raceName,
      classId: player.classId,
      className: player.className,
      characterIdentity: player.characterIdentity,
      level: player.level,
      xp: player.xp,
      gold: player.gold,
      inventory: [...player.inventory].filter(isString),
      equippedWeapon: player.equippedWeapon,
      equippedArmor: player.equippedArmor,
      status: normalizePlayerStatus(player.status),
      health: player.health,
      maxHealth: player.maxHealth,
      attackBonus: player.attackBonus,
      defense: player.defense,
      movement: player.movement,
      completedAdventures: player.completedAdventures,
      completedQuestIds: [...player.completedQuestIds].filter(isString),
      learnedAbilities: [...player.learnedAbilities].filter(isString)
    };

    player.profileId = nextProfile.id;
    player.characterName = nextProfile.name;

    const nextProfiles = existingProfiles.filter((profile) => profile.id !== nextProfile.id);
    nextProfiles.push(nextProfile);
    persistentCharacterProfiles.set(ownerKey, nextProfiles);
  }

  private applyProfileToPlayer(player: PlayerState, profile: PersistentCharacterRecord) {
    player.profileId = profile.id;
    player.characterName = profile.name;
    player.raceId = profile.raceId;
    player.raceName = profile.raceName;
    player.classId = profile.classId;
    player.className = profile.className;
    player.characterIdentity = profile.characterIdentity;
    player.level = profile.level;
    player.xp = profile.xp;
    player.gold = profile.gold;
    player.equippedWeapon = profile.equippedWeapon;
    player.equippedArmor = profile.equippedArmor;
    player.status = profile.status;
    player.alive = profile.status === "alive";
    player.completedAdventures = profile.completedAdventures;
    resetStringArray(player.inventory, profile.inventory);
    resetStringArray(player.completedQuestIds, profile.completedQuestIds);
    resetStringArray(player.learnedAbilities, profile.learnedAbilities.length ? profile.learnedAbilities : [getClassDefinition(profile.classId).abilityId]);
    applyDerivedStatsToPlayer(player, { healToFull: false, resetTurnResources: true });
    player.health = Math.min(player.maxHealth, Math.max(0, profile.health || player.maxHealth));
    player.confirmedCharacter = true;
  }

  private completeAdventureProgress() {
    for (const player of this.state.players.values()) {
      player.completedAdventures += 1;
      this.persistCharacterProfile(player);
    }
  }

  private launchAdventure() {
    if (!this.allPlayersConfirmed()) {
      this.addDmLog("Every connected player must confirm a character before launch.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.roomPhase = "live";
    this.ensureAdventureStarted();
    this.applyMapState("starting", { encounterOnEnter: false });
    this.addPublicLog("The Dungeon Master launches the session.");
    this.syncState();
    this.publishSnapshots();
  }

  private completeSessionFromDm() {
    if (this.roomPhase === "completed") {
      return;
    }

    this.roomPhase = "completed";
    if (!this.state.adventureCompletedAt) {
      this.state.adventureCompletedAt = new Date().toISOString();
    }
    this.completeAdventureProgress();
    this.addPublicLog("The session is complete. The party returns to camp with their spoils.");
    this.applyMapState("camp", { encounterOnEnter: false });
    this.syncState();
    this.publishSnapshots();
  }

  private setMapFromDm(mapKey: MapSlotKey | undefined, fromCommand = false) {
    const normalizedKey = normalizeMapSlotKey(mapKey);

    if (!normalizedKey) {
      this.addDmLog(fromCommand ? `Unknown map: ${mapKey ?? ""}` : "Choose a valid map.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.applyMapState(normalizedKey);
    this.addPublicLog(`Map transition: ${this.getSessionMap(normalizedKey).label}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private setMapDefinitionFromDm(mapKey: MapSlotKey | undefined, mapId: string | undefined) {
    const normalizedKey = normalizeMapSlotKey(mapKey);
    const sessionMap = normalizedKey ? this.sessionMaps.get(normalizedKey) : undefined;
    const mapDefinition = mapId ? mapsById.get(mapId) : undefined;

    if (!normalizedKey || !sessionMap || !mapDefinition) {
      this.addDmLog("Choose a valid session map and base map.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    sessionMap.mapId = mapDefinition.id;

    if (normalizedKey === this.currentMapKey) {
      this.applyMapState(normalizedKey, { encounterOnEnter: false });
    }

    this.addDmLog(`${sessionMap.label} now uses ${mapDefinition.name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private setPlayerSpawnFromDm(playerId: string | undefined, mapKey: MapSlotKey | undefined, x: number | undefined, y: number | undefined) {
    const normalizedKey = normalizeMapSlotKey(mapKey);
    const player = playerId ? this.state.players.get(playerId) : undefined;
    const sessionMap = normalizedKey ? this.sessionMaps.get(normalizedKey) : undefined;

    if (!player || !normalizedKey || !sessionMap || !isWholeNumber(Number(x)) || !isWholeNumber(Number(y))) {
      this.addDmLog("Choose a player, map, and valid spawn coordinates.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const nextPoint = { x: Number(x), y: Number(y) };
    sessionMap.spawnPoints[player.id] = nextPoint;

    if (normalizedKey === this.currentMapKey) {
      this.repositionPlayers();
    }

    this.addDmLog(`Set ${player.name}'s ${sessionMap.label} spawn to (${nextPoint.x + 1}, ${nextPoint.y + 1}).`);
    this.syncState();
    this.publishSnapshots();
  }

  private setPlayerStatusFromDm(playerId: string | undefined, status: PlayerLifeStatus | string | undefined) {
    const player = playerId ? this.state.players.get(playerId) : undefined;
    const normalizedStatus = normalizePlayerStatus(status);

    if (!player) {
      this.addDmLog("Choose a player to update.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    player.status = normalizedStatus;
    player.alive = normalizedStatus === "alive";
    player.health = normalizedStatus === "alive" ? Math.max(1, player.health || player.maxHealth) : 0;
    this.persistCharacterProfile(player);
    this.addDmLog(`${player.name} is now ${normalizedStatus}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private setCampaignDifficultyFromDm(difficulty: CampaignDifficulty | undefined) {
    const normalizedDifficulty = normalizeCampaignDifficulty(difficulty);

    if (!normalizedDifficulty) {
      this.addDmLog("Choose a valid campaign difficulty.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.campaignDifficulty = normalizedDifficulty;
    this.addDmLog(`Campaign difficulty set to ${normalizedDifficulty}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private saveTemplateFromDm(templateName: string | undefined) {
    const name = sanitizeWorldName(templateName, `${this.state.roomCode}-template`);
    const template: SessionTemplateRecord = {
      id: buildRecordId("template", persistentSessionTemplates.size + 1),
      name,
      campaignDifficulty: this.campaignDifficulty,
      maps: [...this.sessionMaps.values()].map((sessionMap) => ({
        key: sessionMap.key,
        label: sessionMap.label,
        mapId: sessionMap.mapId,
        notes: sessionMap.notes,
        spawnPoints: { ...sessionMap.spawnPoints }
      })),
      worldEntities: [...this.worldEntities.values()].map((entity) => ({ ...entity })),
      npcs: [...this.npcs.values()].map((npc) => ({ ...npc })),
      shops: [...this.shops.values()].map((shop) => ({ ...shop, inventory: shop.inventory.map((entry) => ({ ...entry })) })),
      quests: [...this.quests.values()].map((quest) => ({ ...quest, rewardItems: [...quest.rewardItems] })),
      secrets: [...this.secrets.values()].map((secret) => ({ ...secret })),
      encounterGroups: [...this.encounterGroups.values()].map((group) => ({ ...group, enemyIds: [...group.enemyIds], trigger: { ...group.trigger } })),
      sessionNotes: this.sessionNotes.map((note) => ({ ...note }))
    };

    persistentSessionTemplates.set(name.toLowerCase(), template);
    this.addDmLog(`Saved template ${name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private loadTemplateFromDm(templateName: string | undefined) {
    const template = templateName ? persistentSessionTemplates.get(templateName.trim().toLowerCase()) : undefined;

    if (!template) {
      this.addDmLog(`Unknown template: ${templateName ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.campaignDifficulty = template.campaignDifficulty;
    this.sessionMaps.clear();
    for (const sessionMap of template.maps) {
      this.sessionMaps.set(sessionMap.key, {
        key: sessionMap.key,
        label: sessionMap.label,
        mapId: sessionMap.mapId,
        notes: sessionMap.notes,
        spawnPoints: { ...sessionMap.spawnPoints }
      });
    }

    this.worldEntities = new Map(template.worldEntities.map((entity) => [entity.id, { ...entity }]));
    this.npcs = new Map(template.npcs.map((npc) => [npc.id, { ...npc }]));
    this.shops = new Map(template.shops.map((shop) => [shop.id, { ...shop, inventory: shop.inventory.map((entry) => ({ ...entry })) }]));
    this.quests = new Map(template.quests.map((quest) => [quest.id, { ...quest, rewardItems: [...quest.rewardItems] }]));
    this.secrets = new Map(template.secrets.map((secret) => [secret.id, { ...secret }]));
    this.encounterGroups = new Map(template.encounterGroups.map((group) => [group.id, { ...group, enemyIds: [...group.enemyIds], trigger: { ...group.trigger } }]));
    this.sessionNotes = template.sessionNotes.map((note) => ({ ...note }));
    this.applyMapState(this.currentMapKey, { encounterOnEnter: false });
    this.addDmLog(`Loaded template ${template.name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private createEncounterGroupFromDm(message: DmToolMessage) {
    const enemyIds = (message.enemyIds?.length ? message.enemyIds : [message.enemyId ?? "goblin"]).filter(isString);
    const x = Number(message.x ?? 1);
    const y = Number(message.y ?? 1);

    if (!enemyIds.length || !isWholeNumber(x) || !isWholeNumber(y)) {
      this.addDmLog("Choose valid encounter enemies and trigger coordinates.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const encounterId = buildRecordId("encounter", this.encounterGroups.size + 1);
    this.encounterGroups.set(encounterId, {
      id: encounterId,
      mapKey: message.mapKey ?? this.currentMapKey,
      name: sanitizeWorldName(message.name, `Encounter ${this.encounterGroups.size + 1}`),
      enemyIds,
      trigger: { x, y },
      active: false,
      notes: sanitizeWorldText(message.description, "Encounter trigger.")
    });
    this.addDmLog(`Created encounter group ${encounterId}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private activateEncounterGroupFromDm(encounterId: string | undefined) {
    const encounter = encounterId ? this.encounterGroups.get(encounterId) : undefined;

    if (!encounter) {
      this.addDmLog(`Unknown encounter group: ${encounterId ?? ""}`);
      this.syncState();
      this.publishSnapshots();
      return;
    }

    encounter.active = true;

    if (encounter.mapKey === this.currentMapKey) {
      this.activateMapEncounterGroups(encounter.mapKey);
      this.ensureEncounterTurnStarted();
    }

    this.addDmLog(`Activated ${encounter.name}.`);
    this.syncState();
    this.publishSnapshots();
  }

  private activateMapEncounterGroups(mapKey: MapSlotKey) {
    for (const encounter of this.encounterGroups.values()) {
      if (!encounter.active || encounter.mapKey !== mapKey) {
        continue;
      }

      for (const enemyId of encounter.enemyIds) {
        const definition = enemiesById.get(enemyId);
        if (!definition) {
          continue;
        }

        const spawnPosition = this.findOpenPointNear(encounter.trigger);
        const enemy = this.createEnemyState(definition, spawnPosition);
        this.state.enemies.set(enemy.id, enemy);
      }

      encounter.active = false;
    }
  }

  private addSessionNoteFromDm(note: string | undefined) {
    const message = sanitizeWorldText(note, "");

    if (!message) {
      this.addDmLog("Write a session note before saving it.");
      this.syncState();
      this.publishSnapshots();
      return;
    }

    this.sessionNotes.push({ id: buildRecordId("note", this.sessionNotes.length + 1), message });
    if (this.sessionNotes.length > maxLogEntries) {
      this.sessionNotes.shift();
    }
    this.addDmLog("Saved a DM session note.");
    this.syncState();
    this.publishSnapshots();
  }

  private resetAdventure() {
    clearStringArray(this.state.completedEncounters);
    clearLogArray(this.state.publicLog);
    clearLogArray(this.state.dmLog);
    this.state.totalGoldEarned = 0;
    this.state.enemiesDefeated = 0;
    this.state.totalTurns = 0;
    this.state.adventureStartedAt = "";
    this.state.adventureCompletedAt = "";
    this.logIndex = 0;
    this.worldEntities.clear();
    this.npcs.clear();
    this.shops.clear();
    this.quests.clear();
    this.secrets.clear();
    this.skillChecks.clear();
    this.encounterGroups.clear();
    this.rewardHistory = [];
    this.dmNotes = [];
    this.sessionNotes = [];
    this.roomPhase = "preparation";
    this.currentMapKey = "starting";
    this.initializeSessionMaps();

    for (const player of this.state.players.values()) {
      player.alive = true;
      player.status = "alive";
      applyDerivedStatsToPlayer(player, { healToFull: true, resetTurnResources: true });
      this.persistCharacterProfile(player);
    }

    this.repositionPlayers();
    this.recalculatePartyGold();
    this.applyMapState("starting", { encounterOnEnter: false });
    this.addPublicLog("The room resets to preparation mode for the next adventure.");
    this.syncState();
    this.publishSnapshots();
  }

  private ensureAdventureStarted() {
    if (!this.state.adventureStartedAt) {
      this.state.adventureStartedAt = new Date().toISOString();
    }
  }

  private ensureEncounterTurnStarted() {
    if (this.getCurrentScene().sceneType !== "encounter") {
      return;
    }

    if (!this.getLivingPlayerOrder().length) {
      this.clearActiveTurn();
      return;
    }

    if (!this.hasActiveTurn()) {
      this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
    }
  }

  private startNextPlayerTurn(sessionId: string) {
    const player = this.state.players.get(sessionId);

    if (!player || !player.alive) {
      this.clearActiveTurn();
      return;
    }

    this.state.activeTurnType = "player";
    this.state.activeTurnId = sessionId;
    player.remainingMovement = player.movement;
    player.actionUsed = false;
    this.state.totalTurns += 1;
    this.addPublicLog(`${player.name}'s turn begins.`);
  }

  private advanceTurn() {
    if (this.getCurrentScene().sceneType !== "encounter") {
      this.clearActiveTurn();
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const order = this.getLivingPlayerOrder();

    if (!order.length) {
      this.clearActiveTurn();
      this.syncState();
      this.publishSnapshots();
      return;
    }

    const currentIndex = order.indexOf(this.state.activeTurnId);

    if (this.getLivingEnemies().length > 0 && currentIndex === order.length - 1) {
      this.executeEnemyRound();
    } else {
      const nextSessionId =
        currentIndex === -1
          ? order[0]
          : order[(currentIndex + 1 + order.length) % order.length];

      if (nextSessionId) {
        this.startNextPlayerTurn(nextSessionId);
      } else {
        this.clearActiveTurn();
      }
    }

    this.syncState();
    this.publishSnapshots();
  }

  private executeEnemyRound() {
    const livingEnemies = this.getLivingEnemies();

    if (!livingEnemies.length) {
      this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
      return;
    }

    for (const enemy of livingEnemies) {
      if (!enemy.alive) {
        continue;
      }

      this.state.activeTurnType = "enemy";
      this.state.activeTurnId = enemy.id;
      this.state.totalTurns += 1;
      this.addPublicLog(`${enemy.name}'s turn begins.`);

      const target = this.findNearestLivingPlayer(enemy);

      if (!target) {
        this.addPublicLog(`${enemy.name} has no living targets.`);
        continue;
      }

      if (calculateDistance(enemy.x, enemy.y, target.x, target.y) === 1) {
        this.performEnemyAttack(enemy, target);
        continue;
      }

      const nextPoint = this.getEnemyStep(enemy, target);

      if (nextPoint) {
        enemy.x = nextPoint.x;
        enemy.y = nextPoint.y;
        this.addPublicLog(`${enemy.name} moves to (${enemy.x + 1}, ${enemy.y + 1}) toward ${target.name}.`);
      } else {
        this.addPublicLog(`${enemy.name} holds position.`);
      }
    }

    this.startNextPlayerTurn(this.getLivingPlayerOrder()[0] ?? "");
  }

  private performEnemyAttack(enemy: EnemyState, target: PlayerState) {
    this.addPublicLog(`${enemy.name} attacks ${target.name}.`);

    const attackRoll = rollDie(20);
    const attackTotal = attackRoll + enemy.attackBonus;
    this.addPublicLog(`Enemy roll: d20 (${attackRoll}) + ${enemy.attackBonus} = ${attackTotal} vs ${target.defense}.`);

    if (attackTotal < target.defense) {
      this.addPublicLog(`${enemy.name} misses ${target.name}.`);
      return;
    }

    const damageResult = rollDiceExpression(enemy.damageDice);
    target.health = Math.max(0, target.health - damageResult.total);
    target.alive = target.health > 0;

    this.addPublicLog(`${enemy.name} hits ${target.name}.`);
    this.addPublicLog(`Enemy damage: ${damageResult.total}. ${target.name} is now at ${target.health}/${target.maxHealth} HP.`);

    if (!target.alive) {
      target.remainingMovement = 0;
      target.status = resolveDefeatStatus(this.campaignDifficulty);
      this.addPublicLog(`${target.name} is ${formatPlayerStatus(normalizePlayerStatus(target.status))}.`);
    } else {
      target.status = "alive";
    }

    this.persistCharacterProfile(target);
  }

  private findNearestLivingPlayer(enemy: EnemyState) {
    return this.getLivingPlayers().sort((left, right) => {
      const leftDistance = calculateDistance(enemy.x, enemy.y, left.x, left.y);
      const rightDistance = calculateDistance(enemy.x, enemy.y, right.x, right.y);

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left.name.localeCompare(right.name);
    })[0];
  }

  private getEnemyStep(enemy: EnemyState, target: PlayerState): Point | null {
    const deltaX = target.x - enemy.x;
    const deltaY = target.y - enemy.y;
    const candidates: Point[] = [];

    if (deltaX !== 0) {
      candidates.push({ x: enemy.x + Math.sign(deltaX), y: enemy.y });
    }

    if (deltaY !== 0) {
      candidates.push({ x: enemy.x, y: enemy.y + Math.sign(deltaY) });
    }

    for (const candidate of candidates) {
      if (
        candidate.x < 0 ||
        candidate.y < 0 ||
        candidate.x >= this.state.gridWidth ||
        candidate.y >= this.state.gridHeight
      ) {
        continue;
      }

      if (!this.isOccupiedByLivingUnit(candidate.x, candidate.y, enemy.id)) {
        return candidate;
      }
    }

    return null;
  }

  private findOpenPointNear(anchor: Point) {
    const candidates: Point[] = [
      anchor,
      { x: anchor.x + 1, y: anchor.y },
      { x: anchor.x, y: anchor.y + 1 },
      { x: anchor.x - 1, y: anchor.y },
      { x: anchor.x, y: anchor.y - 1 }
    ];

    for (const candidate of candidates) {
      if (
        candidate.x < 0 ||
        candidate.y < 0 ||
        candidate.x >= this.state.gridWidth ||
        candidate.y >= this.state.gridHeight
      ) {
        continue;
      }

      if (!this.isOccupiedByLivingUnit(candidate.x, candidate.y)) {
        return candidate;
      }
    }

    return this.getNextEnemySpawnPoint();
  }

  private restoreDownedPlayersAfterEncounter() {
    if (this.campaignDifficulty !== "casual") {
      return;
    }

    for (const player of this.state.players.values()) {
      if (player.status !== "downed") {
        continue;
      }

      player.status = "alive";
      player.alive = true;
      player.health = Math.max(1, Math.ceil(player.maxHealth / 2));
      this.addPublicLog(`${player.characterName || player.name} gets back up after the encounter.`);
      this.persistCharacterProfile(player);
    }
  }

  private createPlayerState(
    sessionId: string,
    playerName: string,
    character: CharacterDefinition,
    race: RaceDefinition
  ) {
    const player = new PlayerState();
    player.id = sessionId;
    player.name = playerName;
    player.characterName = `${playerName} ${character.name}`.slice(0, 24);
    player.profileId = "";
    player.role = "player";
    player.raceId = race.id;
    player.raceName = race.name;
    player.classId = character.id;
    player.className = character.name;
    player.characterIdentity = `${race.name} ${character.name}`;
    player.confirmedCharacter = false;
    player.status = "alive";
    player.alive = true;
    player.gold = startingPlayerGold;
    player.equippedWeapon = "";
    player.equippedArmor = "";
    player.xp = 0;
    player.level = 1;
    player.abilitySlots = 1;
    player.completedAdventures = 0;
    player.actionUsed = false;
    player.adaptableUsed = false;
    player.luckyFailureUsed = false;
    resetStringArray(player.inventory, character.startingInventory ?? []);
    resetStringArray(player.completedQuestIds, []);
    resetStringArray(player.learnedAbilities, [character.abilityId]);
    applyDerivedStatsToPlayer(player, { healToFull: true, resetTurnResources: true });
    return player;
  }

  private repositionPlayers() {
    const players = [...this.state.players.values()];
    const spawnAssignments = this.getSessionMap().spawnPoints;

    players.forEach((player, index) => {
      const assignedSpawn = spawnAssignments[player.id] ?? spawnAssignments[player.name];
      const spawnPoint = assignedSpawn ?? spawnPoints[index] ?? spawnPoints[spawnPoints.length - 1] ?? { x: 1, y: 1 };
      player.x = spawnPoint.x;
      player.y = spawnPoint.y;
      player.remainingMovement = player.movement;
    });
  }

  private resetEncounterFlags() {
    for (const player of this.state.players.values()) {
      player.actionUsed = false;
      player.adaptableUsed = false;
      player.luckyFailureUsed = false;
    }
  }

  private clearEnemies() {
    this.state.enemies.clear();
  }

  private clearActiveTurn() {
    this.state.activeTurnType = "none";
    this.state.activeTurnId = "";
  }

  private getCurrentScene() {
    return buildSceneForMap(this.getSessionMap(), this.currentMapKey, this.roomPhase);
  }

  private isAdventureStarted() {
    return this.roomPhase !== "preparation";
  }

  private hasDungeonMaster() {
    return Boolean(this.state.dmSessionId);
  }

  private allPlayersConfirmed() {
    const players = [...this.state.players.values()];

    return players.length > 0 && players.every((player) => player.confirmedCharacter);
  }

  private isDmSession(sessionId: string) {
    return this.state.dmSessionId === sessionId;
  }

  private getLivingPlayers() {
    return [...this.state.players.values()].filter((player) => player.alive);
  }

  private getLivingPlayerOrder() {
    return [...this.state.turnOrder].filter((sessionId): sessionId is string => {
      if (typeof sessionId !== "string") {
        return false;
      }

      return Boolean(this.state.players.get(sessionId)?.alive);
    });
  }

  private getLivingEnemies() {
    return [...this.state.enemies.values()].filter((enemy) => enemy.alive);
  }

  private isPlayerTurn(sessionId: string) {
    return this.state.activeTurnType === "player" && this.state.activeTurnId === sessionId;
  }

  private hasActiveTurn() {
    return this.state.activeTurnType !== "none" && this.state.activeTurnId !== "";
  }

  private removeTurnOrderEntry(sessionId: string) {
    const remainingOrder = [...this.state.turnOrder].filter(
      (entry): entry is string => typeof entry === "string" && entry !== sessionId
    );
    resetStringArray(this.state.turnOrder, remainingOrder);
  }

  private addPublicLog(message: string) {
    const entry = new LogEntryState();
    entry.id = this.logIndex;
    entry.message = message;
    this.logIndex += 1;
    this.state.publicLog.push(entry);

    while (this.state.publicLog.length > maxLogEntries) {
      this.state.publicLog.shift();
    }
  }

  private addDmLog(message: string) {
    const entry = new LogEntryState();
    entry.id = this.logIndex;
    entry.message = message;
    this.logIndex += 1;
    this.state.dmLog.push(entry);

    while (this.state.dmLog.length > maxLogEntries) {
      this.state.dmLog.shift();
    }
  }

  private rejectAction(client: Client, message: string) {
    this.send(client, "actionRejected", { message });
  }

  private requireDm(client: Client) {
    if (this.isDmSession(client.sessionId)) {
      return true;
    }

    this.rejectAction(client, "Only the Dungeon Master can use that control.");
    return false;
  }

  private recalculatePartyGold() {
    this.state.partyGold = [...this.state.players.values()].reduce((total, player) => total + player.gold, 0);
  }

  private isOccupied(x: number, y: number, ignoredSessionId?: string) {
    return this.isOccupiedByLivingUnit(x, y, undefined, ignoredSessionId);
  }

  private isOccupiedByLivingUnit(
    x: number,
    y: number,
    ignoredEnemyId?: string,
    ignoredSessionId?: string
  ) {
    for (const [sessionId, player] of this.state.players.entries()) {
      if (!player.alive || sessionId === ignoredSessionId) {
        continue;
      }

      if (player.x === x && player.y === y) {
        return true;
      }
    }

    for (const enemy of this.state.enemies.values()) {
      if (!enemy.alive || enemy.id === ignoredEnemyId) {
        continue;
      }

      if (enemy.x === x && enemy.y === y) {
        return true;
      }
    }

    return false;
  }

  private buildActiveTurnView(): ActiveTurnView {
    if (this.state.activeTurnType === "player") {
      const player = this.state.players.get(this.state.activeTurnId);

      if (player) {
        return { type: "player", id: player.id, name: player.name };
      }
    }

    if (this.state.activeTurnType === "enemy") {
      const enemy = this.state.enemies.get(this.state.activeTurnId);

      if (enemy) {
        return { type: "enemy", id: enemy.id, name: enemy.name };
      }
    }

    return { type: "none", id: "", name: "No active turn" };
  }

  private buildSceneActionsFor(sessionId: string): SceneActionView[] {
    if (this.hasDungeonMaster() || this.isDmSession(sessionId) || this.roomPhase !== "live") {
      return [];
    }

    switch (this.currentMapKey) {
      case "starting":
        return [{ id: "accept_quest", label: "Begin Adventure" }];
      case "camp":
        return [{ id: "return_to_lobby", label: "Return to Lobby" }];
      default:
        return [];
    }
  }

  private buildMerchantItems(): MerchantItemView[] {
    if (this.getCurrentScene().sceneType !== "shop") {
      return [];
    }

    return merchantItemIds
      .map((itemId) => itemsById.get(itemId))
      .filter((item): item is ItemDefinition => item !== undefined)
      .map((item, index) => ({
        entryId: `${item.id}-${index}`,
        id: item.id,
        name: item.name,
        price: item.price,
        effect: item.effect,
        itemType: item.itemType
      }));
  }

  private buildVictorySummary(): VictorySummaryView | null {
    if (this.roomPhase !== "completed") {
      return null;
    }

    const startedAt = this.state.adventureStartedAt ? new Date(this.state.adventureStartedAt).getTime() : Date.now();
    const completedAt = this.state.adventureCompletedAt ? new Date(this.state.adventureCompletedAt).getTime() : Date.now();

    return {
      playersSurvived: this.getLivingPlayers().length,
      goldEarned: this.state.totalGoldEarned,
      enemiesDefeated: this.state.enemiesDefeated,
      totalTurns: this.state.totalTurns,
      adventureDuration: formatDuration(completedAt - startedAt)
    };
  }

  private buildSessionMapViews(): SessionMapView[] {
    return availableMapSlots.map((slot) => {
      const sessionMap = this.getSessionMap(slot.key);
      const mapDefinition = mapsById.get(sessionMap.mapId) ?? defaultMapDefinition();

      return {
        key: slot.key,
        label: sessionMap.label,
        mapId: sessionMap.mapId,
        mapName: mapDefinition.name,
        notes: sessionMap.notes,
        spawnCount: Object.keys(sessionMap.spawnPoints).length,
        encounterCount: [...this.encounterGroups.values()].filter((group) => group.mapKey === slot.key).length,
        entityCount: [...this.worldEntities.values()].filter((entity) => entity.mapKey === slot.key).length
      };
    });
  }

  private buildCharacterProfileViews(ownerName: string): CharacterProfileView[] {
    return (persistentCharacterProfiles.get(normalizeProfileOwner(ownerName)) ?? []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      raceName: profile.raceName,
      className: profile.className,
      level: profile.level,
      xp: profile.xp,
      gold: profile.gold,
      status: profile.status,
      completedAdventures: profile.completedAdventures
    }));
  }

  private buildWorldEntityViews(sessionId: string): WorldEntityView[] {
    const isDm = this.isDmSession(sessionId);

    return [...this.worldEntities.values()]
      .filter((entity) => entity.mapKey === this.currentMapKey)
      .filter((entity) => isDm || isEntityVisibleToPlayers(entity))
      .map((entity) => ({
        id: entity.id,
        type: entity.type,
        name: entity.name,
        description: entity.description,
        x: entity.x,
        y: entity.y,
        visibleToPlayers: isEntityVisibleToPlayers(entity),
        discovered: entity.discovered,
        linkedQuestId: entity.linkedQuestId,
        linkedShopId: entity.linkedShopId,
        linkedItemId: entity.linkedItemId,
        linkedNpcId: entity.linkedNpcId,
        linkedSecretId: entity.linkedSecretId,
        publicDetails: this.buildEntityPublicDetails(entity),
        interaction: entity.interaction
          ? {
              title: entity.interaction.title,
              checkType: entity.interaction.checkType,
              dc: entity.interaction.dc,
              successText: entity.interaction.successText,
              failureText: entity.interaction.failureText,
              targetMode: entity.interaction.targetMode
            }
          : null,
        dmNotes: isDm ? entity.dmNotes : undefined
      }));
  }

  private buildNpcViews(sessionId: string): NpcView[] {
    const isDm = this.isDmSession(sessionId);

    return [...this.npcs.values()]
      .filter((npc) => {
        const entity = npc.linkedEntityId ? this.worldEntities.get(npc.linkedEntityId) : undefined;
        if (isDm) {
          return !entity || entity.mapKey === this.currentMapKey;
        }

        return entity?.mapKey === this.currentMapKey && isEntityVisibleToPlayers(entity);
      })
      .map((npc) => {
        const entity = npc.linkedEntityId ? this.worldEntities.get(npc.linkedEntityId) : undefined;
        return {
          id: npc.id,
          name: npc.name,
          role: npc.role,
          personality: npc.personality,
          publicDescription: npc.publicDescription,
          dialoguePrompt: npc.dialoguePrompt,
          questHooks: npc.questHooks,
          linkedEntityId: npc.linkedEntityId,
          visibleToPlayers: entity ? isEntityVisibleToPlayers(entity) : false,
          discovered: entity?.discovered ?? false
        };
      });
  }

  private buildShopViews(sessionId: string): ShopView[] {
    const isDm = this.isDmSession(sessionId);
    const player = this.state.players.get(sessionId);

    return [...this.shops.values()]
      .filter((shop) => {
        const entity = shop.linkedEntityId ? this.worldEntities.get(shop.linkedEntityId) : undefined;
        if (isDm) {
          return !entity || entity.mapKey === this.currentMapKey;
        }

        return entity?.mapKey === this.currentMapKey && isEntityVisibleToPlayers(entity);
      })
      .map((shop) => {
        const entity = shop.linkedEntityId ? this.worldEntities.get(shop.linkedEntityId) : undefined;
        const accessible = Boolean(
          isDm ||
            (player && entity && calculateDistance(player.x, player.y, entity.x, entity.y) <= 1)
        );

        return {
          id: shop.id,
          name: shop.name,
          shopkeeperNpcId: shop.shopkeeperNpcId,
          linkedEntityId: shop.linkedEntityId,
          visibleToPlayers: entity ? isEntityVisibleToPlayers(entity) : false,
          accessible,
          discountPercent: shop.discountPercent,
          inventory: shop.inventory
            .map((entry) => {
              const item = itemsById.get(entry.itemId);

              if (!item) {
                return undefined;
              }

              return {
                itemId: item.id,
                name: item.name,
                effect: item.effect,
                price: Math.max(0, entry.price - Math.floor(entry.price * (shop.discountPercent / 100))),
                stock: entry.stock
              };
            })
            .filter((entry): entry is ShopItemView => entry !== undefined)
        };
      });
  }

  private buildQuestViews(sessionId: string): QuestView[] {
    const isDm = this.isDmSession(sessionId);

    return [...this.quests.values()]
      .filter((quest) => isDm || quest.status !== "hidden")
      .filter((quest) => quest.assignedTo === "party" || isDm || quest.assignedTo === sessionId)
      .map((quest) => ({
        id: quest.id,
        title: quest.title,
        publicObjective: quest.publicObjective,
        rewardGold: quest.rewardGold,
        rewardItems: quest.rewardItems,
        status: quest.status,
        assignedTo: quest.assignedTo
      }));
  }

  private buildSecretViews(sessionId: string): SecretView[] {
    const isDm = this.isDmSession(sessionId);

    return [...this.secrets.values()]
      .filter((secret) => secret.mapKey === this.currentMapKey)
      .filter((secret) => isDm || secret.revealed)
      .map((secret) => ({
        id: secret.id,
        checkType: secret.checkType,
        dc: secret.dc,
        revealText: secret.revealText,
        revealed: secret.revealed,
        linkedEntityId: secret.linkedEntityId
      }));
  }

  private buildSkillCheckViews(sessionId: string): SkillCheckView[] {
    if (!this.isDmSession(sessionId)) {
      return [];
    }

    return [...this.skillChecks.values()].map((check) => ({
      id: check.id,
      title: check.title,
      description: check.description,
      checkType: check.checkType,
      dc: check.dc,
      targetPlayerIds: check.targetPlayerIds,
      targetNames: check.targetPlayerIds.map((playerId) => this.state.players.get(playerId)?.name ?? playerId),
      visibility: check.visibility,
      successMessage: check.successMessage,
      failureMessage: check.failureMessage,
      status: check.status,
      results: check.targetPlayerIds.map((playerId) => ({
        playerId,
        playerName: this.state.players.get(playerId)?.name ?? playerId,
        rolled: check.results[playerId]?.rolled ?? false,
        roll: check.results[playerId]?.roll ?? 0,
        total: check.results[playerId]?.total ?? 0,
        success: check.results[playerId]?.success ?? false,
        message: check.results[playerId]?.message ?? ""
      }))
    }));
  }

  private buildPlayerSkillCheckViews(sessionId: string): PlayerSkillCheckView[] {
    return [...this.skillChecks.values()]
      .filter((check) => check.targetPlayerIds.includes(sessionId))
      .map((check) => {
        const result = check.results[sessionId];
        const showDc = check.visibility === "public" || check.visibility === "targeted";
        const visibleResult =
          !result?.rolled
            ? ""
            : check.visibility === "dm"
              ? "The DM has recorded your result."
              : result.message;

        return {
          id: check.id,
          title: check.title,
          description: check.description,
          checkType: check.checkType,
          visibility: check.visibility,
          status: check.status,
          showDc,
          dc: showDc ? check.dc : null,
          canRoll: !result?.rolled,
          rolled: result?.rolled ?? false,
          resultText: visibleResult
        };
      });
  }

  private buildEntityPublicDetails(entity: WorldEntityRecord) {
    const npc = entity.linkedNpcId ? this.npcs.get(entity.linkedNpcId) : undefined;
    const shop = entity.linkedShopId ? this.shops.get(entity.linkedShopId) : undefined;

    if (npc) {
      return `${npc.publicDescription} ${npc.dialoguePrompt}`;
    }

    if (shop) {
      return `${entity.description} ${shop.name} offers ${shop.inventory.length} item(s).`;
    }

    return entity.description;
  }

  private syncState() {
    const nextState = new LobbyState();
    nextState.roomCode = this.state.roomCode;
    nextState.dmSessionId = this.state.dmSessionId;
    nextState.dmName = this.state.dmName;
    nextState.currentSceneId = this.state.currentSceneId;
    nextState.gridWidth = this.state.gridWidth;
    nextState.gridHeight = this.state.gridHeight;
    nextState.activeTurnType = this.state.activeTurnType;
    nextState.activeTurnId = this.state.activeTurnId;
    nextState.partyGold = this.state.partyGold;
    nextState.totalGoldEarned = this.state.totalGoldEarned;
    nextState.enemiesDefeated = this.state.enemiesDefeated;
    nextState.totalTurns = this.state.totalTurns;
    nextState.adventureStartedAt = this.state.adventureStartedAt;
    nextState.adventureCompletedAt = this.state.adventureCompletedAt;

    for (const [sessionId, player] of this.state.players.entries()) {
      nextState.players.set(sessionId, clonePlayerState(player));
    }

    for (const [enemyId, enemy] of this.state.enemies.entries()) {
      nextState.enemies.set(enemyId, cloneEnemyState(enemy));
    }

    resetStringArray(nextState.turnOrder, [...this.state.turnOrder].filter(isString));
    resetStringArray(nextState.completedEncounters, [...this.state.completedEncounters].filter(isString));

    for (const entry of this.state.publicLog) {
      nextState.publicLog.push(cloneLogEntry(entry));
    }

    for (const entry of this.state.dmLog) {
      nextState.dmLog.push(cloneLogEntry(entry));
    }

    this.setState(nextState);
  }

  private sendSnapshot(client: Client) {
    this.send(client, "roomState", this.buildSnapshotFor(client.sessionId));
  }

  private publishSnapshots() {
    for (const client of this.clients) {
      this.sendSnapshot(client);
    }
  }

  private buildSnapshotFor(sessionId: string): RoomSnapshot {
    const currentScene = this.getCurrentScene();
    const activeTurn = this.buildActiveTurnView();

    return {
      roomCode: this.state.roomCode,
      selfRole: this.isDmSession(sessionId) ? "dm" : "player",
      dmSessionId: this.state.dmSessionId,
      dmName: this.state.dmName,
      roomPhase: this.roomPhase,
      controlsLocked: this.roomPhase !== "live",
      campaignDifficulty: this.campaignDifficulty,
      currentMapKey: this.currentMapKey,
      sessionMaps: this.buildSessionMapViews(),
      availableMaps: availableMaps.map((map) => ({ id: map.id, name: map.name })),
      savedTemplates: [...persistentSessionTemplates.values()].map((template) => ({ id: template.id, name: template.name })),
      adventureStarted: this.isAdventureStarted(),
      availableRaces: availableRaces.map((race) => ({
        id: race.id,
        name: race.name,
        description: race.description,
        traitName: race.traitName,
        traitDescription: race.traitDescription
      })),
      availableClasses: availableClasses.map((characterClass) => ({
        id: characterClass.id,
        name: characterClass.name,
        description: characterClass.description,
        health: characterClass.health,
        movement: characterClass.movement,
        defense: characterClass.defense,
        attackBonus: characterClass.attackBonus,
        attackRange: characterClass.attackRange,
        spellDamage: characterClass.spellDamage,
        abilityId: characterClass.abilityId,
        abilityName: abilitiesById.get(characterClass.abilityId)?.name ?? "Unknown Ability"
      })),
      availableScenes: availableScenes.map((scene) => ({
        id: scene.id,
        title: scene.title,
        sceneType: scene.sceneType
      })),
      availableEntityTypes,
      availableSkillChecks,
      currentScene: {
        id: currentScene.id,
        title: currentScene.title,
        description: currentScene.description,
        objective: currentScene.objective ?? "Complete the current objective.",
        mapId: currentScene.mapId,
        sceneType: currentScene.sceneType
      },
      sceneActions: this.buildSceneActionsFor(sessionId),
      gridWidth: this.state.gridWidth,
      gridHeight: this.state.gridHeight,
      activeTurn,
      turnOrder: [
        ...this.getLivingPlayerOrder().map((playerId) => {
          const player = this.state.players.get(playerId);

          return player
            ? {
                id: player.id,
                name: player.name,
                kind: "player" as const,
                subtitle: player.className,
                active: activeTurn.type === "player" && activeTurn.id === player.id
              }
            : undefined;
        }),
        ...this.getLivingEnemies().map((enemy) => ({
          id: enemy.id,
          name: enemy.name,
          kind: "enemy" as const,
          subtitle: `${enemy.hp}/${enemy.maxHp} HP`,
          active: activeTurn.type === "enemy" && activeTurn.id === enemy.id
        }))
      ].filter((entry): entry is TurnOrderEntry => entry !== undefined),
      partyGold: this.state.partyGold,
      totalGoldEarned: this.state.totalGoldEarned,
      enemiesDefeated: this.state.enemiesDefeated,
      completedEncounters: [...this.state.completedEncounters].filter(isString),
      merchantItems: this.buildMerchantItems(),
      victorySummary: this.buildVictorySummary(),
      worldEntities: this.buildWorldEntityViews(sessionId),
      npcs: this.buildNpcViews(sessionId),
      shops: this.buildShopViews(sessionId),
      quests: this.buildQuestViews(sessionId),
      secrets: this.buildSecretViews(sessionId),
      skillChecks: this.buildSkillCheckViews(sessionId),
      playerSkillChecks: this.buildPlayerSkillCheckViews(sessionId),
      rewardHistory: this.rewardHistory,
      sessionNotes: this.isDmSession(sessionId) ? this.sessionNotes : [],
      characterProfiles: this.isDmSession(sessionId)
        ? []
        : this.buildCharacterProfileViews(this.state.players.get(sessionId)?.name ?? ""),
      players: [...this.state.players.values()].map((player) => ({
        id: player.id,
        name: player.name,
        characterName: player.characterName,
        profileId: player.profileId,
        role: "player" as const,
        raceId: player.raceId,
        raceName: player.raceName,
        classId: player.classId,
        className: player.className,
        characterIdentity: player.characterIdentity,
        confirmedCharacter: player.confirmedCharacter,
        status: normalizePlayerStatus(player.status),
        x: player.x,
        y: player.y,
        health: player.health,
        maxHealth: player.maxHealth,
        movement: player.movement,
        remainingMovement: player.remainingMovement,
        might: player.might,
        agility: player.agility,
        focus: player.focus,
        spirit: player.spirit,
        defense: player.defense,
        attackBonus: player.attackBonus,
        attackRange: player.attackRange,
        spellDamage: player.spellDamage,
        damageDice: player.damageDice,
        ability: buildAbilityView(player),
        alive: player.alive,
        gold: player.gold,
        inventory: buildInventoryViews(player),
        equippedWeapon: player.equippedWeapon,
        equippedArmor: player.equippedArmor,
        xp: player.xp,
        level: player.level,
        abilitySlots: player.abilitySlots,
        completedAdventures: player.completedAdventures,
        completedQuestIds: [...player.completedQuestIds].filter(isString),
        learnedAbilities: [...player.learnedAbilities].filter(isString),
        actionReady: !player.actionUsed
      })),
      enemies: [...this.state.enemies.values()].map((enemy) => ({
        id: enemy.id,
        name: enemy.name,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        defense: enemy.defense,
        x: enemy.x,
        y: enemy.y,
        movement: enemy.movement,
        attackBonus: enemy.attackBonus,
        damageDice: enemy.damageDice,
        alive: enemy.alive
      })),
      publicLog: [...this.state.publicLog].filter(isLogEntry).map((entry) => ({
        id: entry.id,
        message: entry.message
      })),
      dmLog: this.isDmSession(sessionId)
        ? [...this.state.dmLog].filter(isLogEntry).map((entry) => ({
            id: entry.id,
            message: entry.message
          }))
        : []
    };
  }
}

function getClassDefinition(classId: string) {
  return classesById.get(classId) ?? defaultClass;
}

function getRaceDefinition(raceId: string) {
  return racesById.get(raceId) ?? defaultRace;
}

function getAbilityDefinition(abilityId: string) {
  return abilitiesById.get(abilityId) ?? null;
}

function getEquippedItems(player: PlayerState) {
  return [player.equippedWeapon, player.equippedArmor]
    .map((itemId) => itemsById.get(itemId))
    .filter((item): item is ItemDefinition => item !== undefined);
}

function calculateDerivedStats(player: PlayerState) {
  const characterClass = getClassDefinition(player.classId);
  const race = getRaceDefinition(player.raceId);
  const equipment = getEquippedItems(player);
  const level = Math.max(1, player.level || calculateLevelFromXp(player.xp));
  const levelBonus = level - 1;

  const equipmentBonuses = equipment.reduce(
    (totals, item) => ({
      attackBonus: totals.attackBonus + item.attackBonus,
      defenseBonus: totals.defenseBonus + item.defenseBonus,
      spellDamageBonus: totals.spellDamageBonus + item.spellDamageBonus,
      attackRangeBonus: totals.attackRangeBonus + item.attackRangeBonus,
      maxHealthBonus: totals.maxHealthBonus + item.maxHealthBonus,
      movementBonus: totals.movementBonus + item.movementBonus
    }),
    {
      attackBonus: 0,
      defenseBonus: 0,
      spellDamageBonus: 0,
      attackRangeBonus: 0,
      maxHealthBonus: 0,
      movementBonus: 0
    }
  );

  return {
    className: characterClass.name,
    raceName: race.name,
    characterIdentity: `${race.name} ${characterClass.name}`,
    might: characterClass.coreAttributes.might + race.coreBonuses.might + Math.floor(levelBonus / 2),
    agility: characterClass.coreAttributes.agility + race.coreBonuses.agility + Math.floor(levelBonus / 3),
    focus: characterClass.coreAttributes.focus + race.coreBonuses.focus + Math.floor(levelBonus / 2),
    spirit: characterClass.coreAttributes.spirit + race.coreBonuses.spirit + Math.floor(levelBonus / 2),
    maxHealth:
      characterClass.health + race.statBonuses.maxHealth + equipmentBonuses.maxHealthBonus + levelBonus * 2,
    movement:
      characterClass.movement + race.statBonuses.movement + equipmentBonuses.movementBonus,
    defense: characterClass.defense + race.statBonuses.defense + equipmentBonuses.defenseBonus + Math.floor(levelBonus / 2),
    attackBonus:
      characterClass.attackBonus + race.statBonuses.attackBonus + equipmentBonuses.attackBonus + Math.floor(levelBonus / 2),
    attackRange:
      characterClass.attackRange +
      race.statBonuses.attackRange +
      equipmentBonuses.attackRangeBonus,
    spellDamage:
      characterClass.spellDamage + race.statBonuses.spellDamage + equipmentBonuses.spellDamageBonus + Math.floor(levelBonus / 2),
    damageDice: characterClass.damageDice,
    abilityId: characterClass.abilityId,
    abilityName: getAbilityDefinition(characterClass.abilityId)?.name ?? "Unknown Ability",
    abilitySlots: level >= 5 ? 3 : level >= 3 ? 2 : 1
  };
}

function applyDerivedStatsToPlayer(
  player: PlayerState,
  options: { healToFull?: boolean; resetTurnResources?: boolean } = {}
) {
  const derivedStats = calculateDerivedStats(player);
  const previousMaxHealth = player.maxHealth || derivedStats.maxHealth;
  const preservedHealth = options.healToFull
    ? derivedStats.maxHealth
    : Math.min(derivedStats.maxHealth, Math.max(0, player.health + (derivedStats.maxHealth - previousMaxHealth)));

  player.className = derivedStats.className;
  player.raceName = derivedStats.raceName;
  player.characterIdentity = derivedStats.characterIdentity;
  player.might = derivedStats.might;
  player.agility = derivedStats.agility;
  player.focus = derivedStats.focus;
  player.spirit = derivedStats.spirit;
  player.maxHealth = derivedStats.maxHealth;
  player.health = preservedHealth;
  player.movement = derivedStats.movement;
  player.defense = derivedStats.defense;
  player.attackBonus = derivedStats.attackBonus;
  player.attackRange = derivedStats.attackRange;
  player.spellDamage = derivedStats.spellDamage;
  player.damageDice = derivedStats.damageDice;
  player.abilityId = derivedStats.abilityId;
  player.abilityName = derivedStats.abilityName;
  player.abilitySlots = derivedStats.abilitySlots;

  if (options.healToFull) {
    player.alive = true;
    player.status = "alive";
    player.health = player.maxHealth;
  } else {
    player.alive = player.health > 0 && normalizePlayerStatus(player.status) === "alive";
  }

  if (options.resetTurnResources) {
    player.remainingMovement = player.movement;
    player.actionUsed = false;
  } else {
    player.remainingMovement = Math.min(player.remainingMovement, player.movement);
  }
}

function buildAbilityView(player: PlayerState): AbilityView | null {
  const ability = getAbilityDefinition(player.abilityId);

  if (!ability) {
    return null;
  }

  return {
    id: ability.id,
    name: ability.name,
    description: ability.description,
    range: getAbilityRangeForPlayer(player, ability),
    targetType: ability.targetType,
    usesAttackRoll: ability.usesAttackRoll,
    limit: ability.limit,
    ready: !player.actionUsed
  };
}

function buildInventoryViews(player: PlayerState): InventoryItemView[] {
  return [...player.inventory]
    .filter(isString)
    .map((itemId) => itemsById.get(itemId))
    .filter((item): item is ItemDefinition => item !== undefined)
    .map((item, index) => ({
      entryId: `${item.id}-${index}`,
      id: item.id,
      name: item.name,
      effect: item.effect,
      itemType: item.itemType,
      slot: item.slot,
      equipped: player.equippedWeapon === item.id || player.equippedArmor === item.id,
      usable: item.itemType === "consumable",
      equippable: Boolean(item.slot)
    }));
}

function getAbilityRangeForPlayer(player: PlayerState, ability: AbilityDefinition) {
  const characterClass = getClassDefinition(player.classId);
  const bonusRange = Math.max(0, player.attackRange - characterClass.attackRange);
  return ability.range + bonusRange;
}

function calculatePlayerDamage(player: PlayerState, expression: string) {
  let total = rollDiceExpression(expression).total;

  if (player.raceId === "orc" && player.health <= Math.ceil(player.maxHealth / 2)) {
    total += 1;
  }

  return total;
}

function calculateAbilityDamage(player: PlayerState, ability: AbilityDefinition) {
  let total = calculatePlayerDamage(player, ability.damageDice);

  if (ability.id === "fire_bolt") {
    total += player.spellDamage;
  }

  return total;
}

function calculateHealingAmount(expression: string) {
  return rollDiceExpression(expression).total;
}

function resolvePlayerAttackRoll(player: PlayerState, targetDefense: number) {
  let roll = rollDie(20);
  let rerollMessage = "";

  if (player.raceId === "halfling" && roll === 1 && !player.luckyFailureUsed) {
    player.luckyFailureUsed = true;
    const reroll = rollDie(20);
    rerollMessage = `${player.name}'s Lucky Escape turns a critical failure into a reroll (${roll} -> ${reroll}).`;
    roll = reroll;
  }

  let total = roll + player.attackBonus;

  if (total < targetDefense && player.raceId === "human" && !player.adaptableUsed) {
    player.adaptableUsed = true;
    const reroll = rollDie(20);
    rerollMessage = `${player.name}'s Adaptable trait rerolls a failed attack (${roll} -> ${reroll}).`;
    roll = reroll;
    total = roll + player.attackBonus;
  }

  return {
    roll,
    total,
    hit: total >= targetDefense,
    traitMessage: rerollMessage
  };
}

function clonePlayerState(player: PlayerState) {
  const nextPlayer = new PlayerState();
  nextPlayer.id = player.id;
  nextPlayer.name = player.name;
  nextPlayer.characterName = player.characterName;
  nextPlayer.profileId = player.profileId;
  nextPlayer.role = player.role;
  nextPlayer.raceId = player.raceId;
  nextPlayer.raceName = player.raceName;
  nextPlayer.classId = player.classId;
  nextPlayer.className = player.className;
  nextPlayer.characterIdentity = player.characterIdentity;
  nextPlayer.confirmedCharacter = player.confirmedCharacter;
  nextPlayer.status = player.status;
  nextPlayer.x = player.x;
  nextPlayer.y = player.y;
  nextPlayer.health = player.health;
  nextPlayer.maxHealth = player.maxHealth;
  nextPlayer.movement = player.movement;
  nextPlayer.remainingMovement = player.remainingMovement;
  nextPlayer.might = player.might;
  nextPlayer.agility = player.agility;
  nextPlayer.focus = player.focus;
  nextPlayer.spirit = player.spirit;
  nextPlayer.defense = player.defense;
  nextPlayer.attackBonus = player.attackBonus;
  nextPlayer.attackRange = player.attackRange;
  nextPlayer.spellDamage = player.spellDamage;
  nextPlayer.damageDice = player.damageDice;
  nextPlayer.abilityId = player.abilityId;
  nextPlayer.abilityName = player.abilityName;
  nextPlayer.alive = player.alive;
  nextPlayer.gold = player.gold;
  nextPlayer.equippedWeapon = player.equippedWeapon;
  nextPlayer.equippedArmor = player.equippedArmor;
  nextPlayer.xp = player.xp;
  nextPlayer.level = player.level;
  nextPlayer.abilitySlots = player.abilitySlots;
  nextPlayer.completedAdventures = player.completedAdventures;
  nextPlayer.actionUsed = player.actionUsed;
  nextPlayer.adaptableUsed = player.adaptableUsed;
  nextPlayer.luckyFailureUsed = player.luckyFailureUsed;
  resetStringArray(nextPlayer.inventory, [...player.inventory].filter(isString));
  resetStringArray(nextPlayer.completedQuestIds, [...player.completedQuestIds].filter(isString));
  resetStringArray(nextPlayer.learnedAbilities, [...player.learnedAbilities].filter(isString));
  return nextPlayer;
}

function cloneEnemyState(enemy: EnemyState) {
  const nextEnemy = new EnemyState();
  nextEnemy.id = enemy.id;
  nextEnemy.name = enemy.name;
  nextEnemy.hp = enemy.hp;
  nextEnemy.maxHp = enemy.maxHp;
  nextEnemy.defense = enemy.defense;
  nextEnemy.x = enemy.x;
  nextEnemy.y = enemy.y;
  nextEnemy.movement = enemy.movement;
  nextEnemy.attackBonus = enemy.attackBonus;
  nextEnemy.damageDice = enemy.damageDice;
  nextEnemy.alive = enemy.alive;
  return nextEnemy;
}

function cloneLogEntry(entry: LogEntryState) {
  const nextEntry = new LogEntryState();
  nextEntry.id = entry.id;
  nextEntry.message = entry.message;
  return nextEntry;
}

function clearStringArray(target: { length: number; pop(): void }) {
  while (target.length > 0) {
    target.pop();
  }
}

function clearLogArray(target: { length: number; pop(): void }) {
  while (target.length > 0) {
    target.pop();
  }
}

function resetStringArray(target: { length: number; pop(): void; push(value: string): void }, values: string[]) {
  clearStringArray(target);

  for (const value of values) {
    target.push(value);
  }
}

function removeInventoryItem(
  target: { length: number; pop(): void; push(value: string): void } & Iterable<string>,
  indexToRemove: number
) {
  const nextValues = [...target].filter((value, index) => typeof value === "string" && index !== indexToRemove);
  resetStringArray(target, nextValues);
}

function appendUniqueString(target: { push(value: string): void } & Iterable<string>, value: string) {
  for (const existing of target) {
    if (existing === value) {
      return;
    }
  }

  target.push(value);
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}

function isLogEntry(value: LogEntryState | undefined): value is LogEntryState {
  return value !== undefined;
}

function calculateDistance(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
}

function rollDie(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function rollDiceExpression(expression: string) {
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/i);

  if (!match) {
    return { total: 0 };
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = Number(match[3] ?? 0);
  let total = modifier;

  for (let index = 0; index < count; index += 1) {
    total += rollDie(sides);
  }

  return { total };
}

function isWholeNumber(value: number) {
  return Number.isInteger(value);
}

function buildRecordId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function calculateLevelFromXp(xp: number) {
  let level = 1;

  for (let index = 0; index < levelThresholds.length; index += 1) {
    const threshold = levelThresholds[index] ?? Number.MAX_SAFE_INTEGER;

    if (xp >= threshold) {
      level = index + 1;
    }
  }

  return Math.min(5, level);
}

function sanitizeWorldName(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 40) : fallback;
}

function sanitizeWorldText(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 220) : fallback;
}

function normalizeSkillCheckType(value: SkillCheckType | string | undefined): SkillCheckType {
  const normalized = value?.trim().toLowerCase();

  if (availableSkillChecks.includes(normalized as SkillCheckType)) {
    return normalized as SkillCheckType;
  }

  return "insight";
}

function normalizeRewardType(value: string | undefined): RewardType | null {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "gold":
    case "item":
    case "xp":
    case "healing":
    case "quest_progress":
    case "quest-progress":
      return normalized === "quest-progress" ? "quest_progress" : normalized;
    default:
      return null;
  }
}

function normalizeAutomationEffectType(value: string | undefined): AutomationEffectType {
  switch (value?.trim().toLowerCase()) {
    case "reveal_secret":
    case "reward":
    case "quest_progress":
    case "shop_discount":
    case "trigger_event":
    case "trigger_combat":
    case "narration":
      return value.trim().toLowerCase() as AutomationEffectType;
    default:
      return "none";
  }
}

function buildAutomationEffect(message: DmToolMessage, branch: "success" | "failure"): AutomationEffect {
  const effectType = normalizeAutomationEffectType(branch === "success" ? message.effectType : message.failureEffectType);
  const rewardType = normalizeRewardType(message.name);

  return {
    type: effectType,
    reward:
      effectType === "reward" && rewardType
        ? {
            type: rewardType,
            amount: message.amount,
            itemId: message.itemId,
            questId: message.questId,
            targetPlayerIds: message.targetPlayerIds
          }
        : undefined,
    linkedSecretId: message.linkedSecretId,
    questId: message.questId,
    linkedShopId: message.linkedShopId,
    discountPercent: message.discountPercent,
    encounterId: message.encounterId,
    narration: message.note
  };
}

function normalizeQuestStatus(value: string | undefined): QuestStatus {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "offered":
    case "active":
    case "completed":
    case "failed":
    case "hidden":
      return normalized;
    default:
      return "hidden";
  }
}

function normalizeCampaignDifficulty(value: string | undefined): CampaignDifficulty | null {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "casual":
    case "hardcore":
    case "legendary":
      return normalized;
    default:
      return null;
  }
}

function normalizeMapSlotKey(value: string | undefined): MapSlotKey | null {
  const normalized = value?.trim().toLowerCase();

  switch (normalized) {
    case "starting":
    case "adventure":
    case "boss":
    case "camp":
      return normalized;
    default:
      return null;
  }
}

function sceneIdFromMapKey(mapKey: MapSlotKey) {
  switch (mapKey) {
    case "starting":
      return "tavern";
    case "adventure":
      return "forest";
    case "boss":
      return "boss";
    case "camp":
    default:
      return "merchant";
  }
}

function mapKeyFromSceneId(sceneId: string) {
  switch (sceneId) {
    case "forest":
      return "adventure";
    case "boss":
      return "boss";
    case "merchant":
      return "camp";
    case "victory":
      return "camp";
    case "tavern":
    default:
      return "starting";
  }
}

function normalizeProfileOwner(name: string) {
  return name.trim().toLowerCase();
}

function normalizePlayerStatus(status: string | undefined): PlayerLifeStatus {
  switch (status) {
    case "downed":
    case "dead":
    case "permanentlyDead":
    case "alive":
      return status;
    default:
      return "alive";
  }
}

function resolveDefeatStatus(difficulty: CampaignDifficulty): PlayerLifeStatus {
  switch (difficulty) {
    case "casual":
      return "downed";
    case "hardcore":
      return "dead";
    case "legendary":
      return "permanentlyDead";
  }
}

function formatPlayerStatus(status: PlayerLifeStatus) {
  switch (status) {
    case "downed":
      return "downed";
    case "dead":
      return "dead";
    case "permanentlyDead":
      return "lost permanently";
    case "alive":
    default:
      return "standing";
  }
}

function isEntityVisibleToPlayers(entity: WorldEntityRecord) {
  return entity.visibilityState === "visible" || entity.visibilityState === "revealed";
}

function capitalizeCheckType(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function formatEntityTypeLabel(type: WorldEntityType) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function tokenizeCommand(commandBody: string) {
  const tokens: string[] = [];
  const matcher = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(commandBody))) {
    tokens.push(match[1] ?? match[2] ?? "");
  }

  return tokens;
}

function resolveTargetPlayerIds(
  players: Map<string, PlayerState> | ColyseusMapLike<PlayerState>,
  target: "party" | "all" | "player",
  playerId?: string,
  playerName?: string,
  targetPlayerIds?: string[]
) {
  const allPlayers = [...players.values()];

  if (target === "party" || target === "all") {
    return allPlayers.map((player) => player.id);
  }

  if (targetPlayerIds?.length) {
    return targetPlayerIds.filter((id) => allPlayers.some((player) => player.id === id));
  }

  if (playerId && allPlayers.some((player) => player.id === playerId)) {
    return [playerId];
  }

  const matchedPlayer = playerName
    ? allPlayers.find((player) => player.name.toLowerCase() === playerName.toLowerCase())
    : undefined;

  return matchedPlayer ? [matchedPlayer.id] : [];
}

function getSkillModifier(player: PlayerState, checkType: SkillCheckType) {
  switch (checkType) {
    case "strength":
      return player.might;
    case "dexterity":
    case "stealth":
      return player.agility;
    case "arcana":
    case "perception":
    case "investigation":
      return player.focus;
    case "intimidation":
      return player.might;
    case "persuasion":
    case "insight":
    default:
      return player.spirit;
  }
}

type ColyseusMapLike<T> = {
  values(): IterableIterator<T>;
};

function normalizeRoomCode(roomCode?: string) {
  const normalized = roomCode?.trim().toLowerCase();

  if (!normalized) {
    return "local-adventure";
  }

  return normalized.replace(/[^a-z0-9-_]/g, "").slice(0, 24) || "local-adventure";
}

function normalizeJoinRole(role?: JoinRole) {
  return role === "dm" ? "dm" : "player";
}

function sanitizePlayerName(playerName?: string) {
  const trimmedName = playerName?.trim();

  if (!trimmedName) {
    return `Guest-${Math.random().toString(36).slice(2, 6)}`;
  }

  return trimmedName.slice(0, 20);
}

function defaultSceneDefinition(): SceneDefinition {
  return scenesById.get("tavern") ?? {
    id: "tavern",
    title: "Tavern",
    description: "Gather your party.",
    mapId: "tavern",
    sceneType: "story",
    objective: "Begin the adventure."
  };
}

function defaultSessionMapRecord(mapKey: MapSlotKey): SessionMapRecord {
  const slot = availableMapSlots.find((entry) => entry.key === mapKey) ?? availableMapSlots[0];
  return {
    key: mapKey,
    label: slot?.label ?? "Session Map",
    mapId: slot?.defaultMapId ?? "forest",
    notes: "",
    spawnPoints: {}
  };
}

function buildSceneForMap(sessionMap: SessionMapRecord, mapKey: MapSlotKey, roomPhase: RoomPhase): SceneDefinition {
  const map = mapsById.get(sessionMap.mapId) ?? defaultMapDefinition();
  const sceneType =
    roomPhase === "completed"
      ? "victory"
      : mapKey === "adventure" || mapKey === "boss"
        ? "encounter"
        : mapKey === "camp"
          ? "shop"
          : "story";

  return {
    id: sceneIdFromMapKey(mapKey),
    title: sessionMap.label,
    description:
      roomPhase === "preparation"
        ? `Preparation mode: ${map.name}.`
        : `Current location: ${map.name}.`,
    mapId: sessionMap.mapId,
    sceneType,
    objective:
      roomPhase === "preparation"
        ? "The Dungeon Master is preparing the session."
        : mapKey === "camp"
          ? "Rest, recover, and regroup."
          : mapKey === "boss"
            ? "Defeat the boss encounter."
            : mapKey === "adventure"
              ? "Overcome the active encounter."
              : "Wait for the next map transition."
  };
}

function defaultMapDefinition(): MapDefinition {
  return mapsById.get("forest") ?? {
    id: "forest",
    name: "Forest Road",
    width: 10,
    height: 8
  };
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
