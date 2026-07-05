export type AssetCategory = "map" | "npc" | "enemy" | "item" | "shop" | "cover" | "environment";

export interface AssetOwnership {
  ownerId?: string;
  ownerName?: string;
  license?: string;
  marketplaceSku?: string;
}

export interface AssetDefinition {
  id: string;
  name: string;
  category: AssetCategory;
  imagePath: string;
  thumbnailPath?: string;
  tags?: string[];
  author?: string;
  source?: "official" | "custom" | "generated";
  createdAt?: string;
  version?: string;
  ownership?: AssetOwnership;
}

export interface Position {
  x: number;
  y: number;
}

export interface EncounterZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  encounterId?: string;
}

export interface NPCPlacement extends Position {
  npcId: string;
}

export interface ShopPlacement extends Position {
  shopId: string;
}

export interface QuestMarker extends Position {
  questId: string;
  label: string;
}

export interface MapMetadata {
  mapId: string;
  assetId: string;
  spawnPoints: Position[];
  encounterZones: EncounterZone[];
  npcPositions: NPCPlacement[];
  shopPositions: ShopPlacement[];
  questMarkers: QuestMarker[];
}
