import officialCampaigns from "../../../content/campaigns.json";
import type { FactionId, LobbyView, TimeOfDay, WeatherType } from "../game/types";
import { buildAssetPackageManifest, validateAssetReferences, type AssetPackageManifest } from "./assetLibrary";

export type CampaignCategory = "official" | "community" | "my";
export type CampaignSelectionMode = "new" | "custom" | "prebuilt";
export type CampaignOwnership = "creator" | "official";
export type CampaignVisibility = "private" | "shared" | "public" | "official";

export interface CampaignMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  difficulty: string;
  recommendedPlayers: string;
  theme: string;
  levelRange: string;
  tags: string[];
  thumbnail?: string;
  coverImage?: string;
  assetIds?: string[];
  createdDate: string;
  updatedDate: string;
  estimatedLength: string;
  creatorName: string;
  changeNotes: string;
  visibility: CampaignVisibility;
  ownership: CampaignOwnership;
  requiredPacks: string[];
}

export interface CampaignSessionMapPackage {
  key: string;
  label: string;
  mapId: string;
  notes: string;
  fogAreas?: LobbyView["fogAreas"];
  revealAll?: boolean;
  spawnSlots: Partial<Record<`P${1 | 2 | 3 | 4 | 5 | 6}`, { x: number; y: number }>>;
}

export interface CampaignStatePackage {
  campaignDifficulty: LobbyView["campaignDifficulty"];
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  factionReputation: Partial<Record<FactionId, number>>;
  sessionMaps: CampaignSessionMapPackage[];
  currentMapKey: string;
  worldEntities: LobbyView["worldEntities"];
  npcs: LobbyView["npcs"];
  shops: LobbyView["shops"];
  quests: LobbyView["quests"];
  secrets: LobbyView["secrets"];
  encounterGroups: LobbyView["encounterGroups"];
  triggerZones: LobbyView["triggerZones"];
  dynamicEvents: LobbyView["dynamicEvents"];
  patrolRoutes: LobbyView["patrolRoutes"];
  journalEntries: LobbyView["journalEntries"];
  sessionNotes: LobbyView["sessionNotes"];
  rewardHistory: LobbyView["rewardHistory"];
}

export interface CampaignPackage {
  metadata: CampaignMetadata;
  state: CampaignStatePackage;
  assets?: AssetPackageManifest;
}

export interface CampaignLibraryEntry {
  category: CampaignCategory;
  metadata: CampaignMetadata;
  packageData: CampaignPackage;
  officialAdventureTemplateId?: string | undefined;
}

export interface CampaignTemplateDefinition {
  id: string;
  name: string;
  description: string;
  recommendedMaps: number;
  recommendedQuests: number;
  recommendedTheme: string;
  recommendedPlayerCount: string;
}

const campaignTemplates: CampaignTemplateDefinition[] = [
  {
    id: "one_shot",
    name: "One Shot",
    description: "A compact campaign shell for a single-session adventure with a fast intro, one main route, and a finale.",
    recommendedMaps: 4,
    recommendedQuests: 2,
    recommendedTheme: "Adventure",
    recommendedPlayerCount: "2-6"
  },
  {
    id: "short_campaign",
    name: "Short Campaign",
    description: "A reusable setup for a 2-3 session arc with room for side objectives and a boss map.",
    recommendedMaps: 5,
    recommendedQuests: 3,
    recommendedTheme: "Frontier",
    recommendedPlayerCount: "2-6"
  },
  {
    id: "epic_campaign",
    name: "Epic Campaign",
    description: "A larger template with more room for faction play, discoveries, and multiple encounter chains.",
    recommendedMaps: 8,
    recommendedQuests: 5,
    recommendedTheme: "Epic",
    recommendedPlayerCount: "3-6"
  },
  {
    id: "dungeon_crawl",
    name: "Dungeon Crawl",
    description: "A combat-heavy template tuned for linked dungeon spaces and escalating encounters.",
    recommendedMaps: 5,
    recommendedQuests: 2,
    recommendedTheme: "Dungeon",
    recommendedPlayerCount: "2-6"
  },
  {
    id: "investigation",
    name: "Investigation",
    description: "A clue-focused template centered on social scenes, secrets, and reveal triggers.",
    recommendedMaps: 4,
    recommendedQuests: 4,
    recommendedTheme: "Mystery",
    recommendedPlayerCount: "2-5"
  }
];

const libraryStorageKey = "loki-lite-adventures-campaign-library";
export const campaignValidationPackIds = ["core-pack", "goblin-pack", "undead-pack", "bandit-pack", "arcane-pack", "wilderness-pack", "vampire-pack"];
const packAliases: Record<string, string> = {
  "core-pack": "core",
  "goblin-pack": "goblin",
  "undead-pack": "undead",
  "bandit-pack": "bandit",
  "arcane-pack": "arcane",
  "wilderness-pack": "wilderness",
  "vampire-pack": "vampire"
};

function normalizePackId(packId: string) {
  return packAliases[packId] ?? packId;
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "campaign";
}

function defaultSessionMaps(): CampaignSessionMapPackage[] {
  return [
    { key: "starting", label: "Starting Area", mapId: "tavern", notes: "", spawnSlots: { P1: { x: 1, y: 1 }, P2: { x: 2, y: 1 } } },
    { key: "adventure", label: "Adventure Area", mapId: "forest", notes: "", spawnSlots: {} },
    { key: "boss", label: "Boss Area", mapId: "boss_room", notes: "", spawnSlots: {} },
    { key: "camp", label: "Camp", mapId: "camp", notes: "", spawnSlots: {} }
  ];
}

function emptyCampaignState(): CampaignStatePackage {
  return {
    campaignDifficulty: "casual",
    timeOfDay: "morning",
    weather: "clear",
    factionReputation: {},
    sessionMaps: defaultSessionMaps(),
    currentMapKey: "starting",
    worldEntities: [],
    npcs: [],
    shops: [],
    quests: [],
    secrets: [],
    encounterGroups: [],
    triggerZones: [],
    dynamicEvents: [],
    patrolRoutes: [],
    journalEntries: [],
    sessionNotes: [],
    rewardHistory: []
    };
}

function normalizeMetadata(input: Partial<CampaignMetadata>, fallbackName: string): CampaignMetadata {
  const stamp = todayStamp();
  const name = input.name?.trim() || fallbackName;

  return {
    id: slugify(input.id?.trim() || name),
    name,
    description: input.description?.trim() || "",
    author: input.author?.trim() || input.creatorName?.trim() || "Unknown Creator",
    version: input.version?.trim() || "1.0.0",
    difficulty: input.difficulty?.trim() || "medium",
    recommendedPlayers: input.recommendedPlayers?.trim() || "2-6",
    theme: input.theme?.trim() || "Adventure",
    levelRange: input.levelRange?.trim() || "1-3",
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : [],
    thumbnail: input.thumbnail?.trim() || "",
    coverImage: input.coverImage?.trim() || input.thumbnail?.trim() || "",
    assetIds: Array.isArray(input.assetIds) ? [...new Set(input.assetIds.filter(Boolean))] : [],
    createdDate: input.createdDate?.trim() || stamp,
    updatedDate: input.updatedDate?.trim() || stamp,
    estimatedLength: input.estimatedLength?.trim() || "1-2 Sessions",
    creatorName: input.creatorName?.trim() || input.author?.trim() || "Unknown Creator",
    changeNotes: input.changeNotes?.trim() || "",
    visibility: input.visibility ?? "private",
    ownership: input.ownership ?? "creator",
    requiredPacks: Array.isArray(input.requiredPacks) ? input.requiredPacks.map((packId) => normalizePackId(packId)).filter(Boolean) : []
  };
}

function readStoredLibrary(): CampaignLibraryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(libraryStorageKey);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CampaignLibraryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredLibrary(entries: CampaignLibraryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(libraryStorageKey, JSON.stringify(entries));
}

export function getCampaignTemplates() {
  return campaignTemplates;
}

export function getOfficialCampaigns(): CampaignLibraryEntry[] {
  return (officialCampaigns as Array<Record<string, unknown>>).map((campaign) => {
    const packageData = campaign.packageData as Partial<CampaignPackage> | undefined;
    const rawMetadata = (campaign.metadata ?? packageData?.metadata ?? campaign) as Partial<CampaignMetadata>;
    const metadata = normalizeMetadata(rawMetadata, String(rawMetadata.name ?? "Official Campaign"));
    const officialAdventureTemplateId = typeof campaign.adventureTemplateId === "string" ? campaign.adventureTemplateId : undefined;
    const metadataWithAssets = { ...metadata, ownership: "official" as const, visibility: "official" as const };
    return {
      category: "official" as const,
      metadata: metadataWithAssets,
      packageData: packageData?.state
        ? {
            metadata: metadataWithAssets,
            state: packageData.state as CampaignStatePackage,
            assets: packageData.assets ?? buildAssetPackageManifest(metadataWithAssets.assetIds)
          }
        : {
            metadata: metadataWithAssets,
            state: emptyCampaignState(),
            assets: buildAssetPackageManifest(metadataWithAssets.assetIds)
          },
      ...(officialAdventureTemplateId ? { officialAdventureTemplateId } : {})
    };
  });
}

export function getStoredCampaigns() {
  return readStoredLibrary();
}

export function saveCampaignToLibrary(entry: CampaignLibraryEntry) {
  const current = readStoredLibrary().filter((existing) => existing.metadata.id !== entry.metadata.id);
  current.unshift(entry);
  writeStoredLibrary(current);
}

export function saveImportedCampaign(packageData: CampaignPackage, category: CampaignCategory) {
  saveCampaignToLibrary({
    category,
    metadata: packageData.metadata,
    packageData
  });
}

export function validateCampaignPackage(packageData: CampaignPackage, availablePackIds: string[]) {
  if (!packageData || typeof packageData !== "object") {
    return { valid: false, error: "Campaign file must be a JSON object." };
  }

  if (!packageData.metadata || !packageData.state) {
    return { valid: false, error: "Campaign file is missing metadata or state." };
  }

  const metadata = normalizeMetadata(packageData.metadata, "Imported Campaign");
  const maps = Array.isArray(packageData.state.sessionMaps) ? packageData.state.sessionMaps : [];

  if (!maps.length) {
    return { valid: false, error: "Campaign file must include at least one session map." };
  }

  const normalizedAvailablePackIds = availablePackIds.map((packId) => normalizePackId(packId));
  const missingPacks = metadata.requiredPacks.filter((packId) => !normalizedAvailablePackIds.includes(normalizePackId(packId)));

  if (missingPacks.length) {
    return { valid: false, error: `Missing content packs: ${missingPacks.join(", ")}` };
  }

  const assetValidation = validateAssetReferences(metadata.assetIds);

  if (!assetValidation.valid) {
    return { valid: false, error: `Missing assets: ${assetValidation.missingAssetIds.join(", ")}` };
  }

  return {
    valid: true,
    normalized: {
      metadata,
      state: packageData.state,
      assets: packageData.assets ?? buildAssetPackageManifest(metadata.assetIds)
    } satisfies CampaignPackage
  };
}

export function buildCampaignPackageFromLobby(lobby: LobbyView, metadataInput: Partial<CampaignMetadata>): CampaignPackage {
  const metadata = normalizeMetadata(metadataInput, lobby.currentCampaign?.name ?? "Custom Campaign");

  return {
    metadata: {
      ...metadata,
      updatedDate: todayStamp()
    },
    state: {
      campaignDifficulty: lobby.campaignDifficulty,
      timeOfDay: lobby.timeOfDay,
      weather: lobby.weather,
      factionReputation: Object.fromEntries(lobby.factionReputation.map((entry) => [entry.factionId, entry.score])),
      sessionMaps: lobby.sessionMaps.map((map) => ({
        key: map.key,
        label: map.label,
        mapId: map.mapId,
        notes: map.notes,
        fogAreas: map.fogAreas,
        revealAll: map.revealAll,
        spawnSlots: map.spawnSlots.reduce<CampaignSessionMapPackage["spawnSlots"]>((accumulator, slot) => {
          accumulator[slot.id] = { x: slot.x, y: slot.y };
          return accumulator;
        }, {})
      })),
      currentMapKey: lobby.currentMapKey,
      worldEntities: lobby.worldEntities,
      npcs: lobby.npcs,
      shops: lobby.shops,
      quests: lobby.quests,
      secrets: lobby.secrets,
      encounterGroups: lobby.encounterGroups,
      triggerZones: lobby.triggerZones,
      dynamicEvents: lobby.dynamicEvents,
      patrolRoutes: lobby.patrolRoutes,
      journalEntries: lobby.journalEntries,
      sessionNotes: lobby.sessionNotes,
      rewardHistory: lobby.rewardHistory
    },
    assets: buildAssetPackageManifest(metadata.assetIds)
  };
}

export function createTemplateCampaignPackage(templateId: string, authorName: string) {
  const template = campaignTemplates.find((entry) => entry.id === templateId) ?? campaignTemplates[0]!;
  const stamp = todayStamp();
  const metadata = normalizeMetadata(
    {
      id: `${template.id}_${stamp}`,
      name: `${template.name} Campaign`,
      description: template.description,
      author: authorName || "Dungeon Master",
      creatorName: authorName || "Dungeon Master",
      version: "1.0.0",
      difficulty: "medium",
      recommendedPlayers: template.recommendedPlayerCount,
      theme: template.recommendedTheme,
      levelRange: "1-3",
      tags: [template.id, "template"],
      estimatedLength: template.id === "epic_campaign" ? "4+ Sessions" : template.id === "short_campaign" ? "2-3 Sessions" : "1-2 Sessions",
      visibility: "private",
      ownership: "creator",
      requiredPacks: ["core"]
    },
    template.name
  );

  return {
    metadata,
    state: emptyCampaignState(),
    assets: buildAssetPackageManifest(metadata.assetIds)
  } satisfies CampaignPackage;
}

export function triggerCampaignDownload(packageData: CampaignPackage, format: "json" | "package") {
  const fileName = `${slugify(packageData.metadata.name)}.${format === "json" ? "json" : "loki-campaign.json"}`;
  const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}
