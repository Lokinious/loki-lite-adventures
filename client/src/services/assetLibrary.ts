import assetRegistry from "../../../content/assets/index.json";
import cryptEntranceMetadata from "../../../content/assets/maps/crypt-entrance.meta.json";
import forgottenCryptMetadata from "../../../content/assets/maps/forgotten-crypt.meta.json";
import necromancerSanctumMetadata from "../../../content/assets/maps/necromancer-sanctum.meta.json";
import type { AssetCategory, AssetDefinition, MapMetadata } from "../../../content/assets/schema";

const officialAssets = assetRegistry as AssetDefinition[];
const mapMetadata = [
  cryptEntranceMetadata,
  forgottenCryptMetadata,
  necromancerSanctumMetadata
] as MapMetadata[];

export type AssetPackageFileGroup = "assets" | "maps" | "portraits" | "icons";

export interface AssetPackageManifest {
  version: string;
  assetIds: string[];
  assets: AssetDefinition[];
  files: Record<AssetPackageFileGroup, string[]>;
  mapMetadata: MapMetadata[];
}

export function getAssetRegistry() {
  return officialAssets;
}

export function getAssetsByCategory(category: AssetCategory) {
  return officialAssets.filter((asset) => asset.category === category);
}

export function getAssetById(assetId: string) {
  return officialAssets.find((asset) => asset.id === assetId) ?? null;
}

export function getMapMetadataByAssetId(assetId: string) {
  return mapMetadata.find((metadata) => metadata.assetId === assetId) ?? null;
}

export function getMapMetadataByMapId(mapId: string) {
  return mapMetadata.find((metadata) => metadata.mapId === mapId) ?? null;
}

export function resolveCampaignAssets(assetIds: string[] = []) {
  const uniqueAssetIds = [...new Set(assetIds)];
  return uniqueAssetIds.map((assetId) => getAssetById(assetId)).filter((asset): asset is AssetDefinition => asset !== null);
}

export function findMissingAssetIds(assetIds: string[] = []) {
  return [...new Set(assetIds)].filter((assetId) => !getAssetById(assetId));
}

function packageGroupForAsset(asset: AssetDefinition): AssetPackageFileGroup {
  if (asset.category === "map") {
    return "maps";
  }

  if (asset.category === "npc" || asset.category === "enemy" || asset.category === "cover" || asset.category === "environment") {
    return "portraits";
  }

  return "icons";
}

export function buildAssetPackageManifest(assetIds: string[] = []): AssetPackageManifest {
  const assets = resolveCampaignAssets(assetIds);
  const files: Record<AssetPackageFileGroup, string[]> = {
    assets: [],
    maps: [],
    portraits: [],
    icons: []
  };

  assets.forEach((asset) => {
    files.assets.push(asset.imagePath);
    files[packageGroupForAsset(asset)].push(asset.imagePath);
    if (asset.thumbnailPath && asset.thumbnailPath !== asset.imagePath) {
      files.assets.push(asset.thumbnailPath);
    }
  });

  return {
    version: "1.0.0",
    assetIds: assets.map((asset) => asset.id),
    assets,
    files: {
      assets: [...new Set(files.assets)],
      maps: [...new Set(files.maps)],
      portraits: [...new Set(files.portraits)],
      icons: [...new Set(files.icons)]
    },
    mapMetadata: assets
      .filter((asset) => asset.category === "map")
      .map((asset) => getMapMetadataByAssetId(asset.id))
      .filter((metadata): metadata is MapMetadata => metadata !== null)
  };
}

export function validateAssetReferences(assetIds: string[] = []) {
  const missingAssetIds = findMissingAssetIds(assetIds);

  return {
    valid: missingAssetIds.length === 0,
    missingAssetIds
  };
}
