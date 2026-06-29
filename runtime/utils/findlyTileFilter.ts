import type { Filter, FilterGroup } from '@plentymarkets/shop-api';
import type {
  FindlyFacetWithTiles,
  FindlyFilterTile,
  FindlyFilterWithTile,
  FindlyTilePreset,
} from '../types/findlyTile';

function trimString(value: unknown): string {
  return String(value ?? '').trim();
}

export function hasFindlyTileFacet(facet?: FilterGroup | null): facet is FindlyFacetWithTiles {
  const extended = facet as FindlyFacetWithTiles | null | undefined;

  return Array.isArray(extended?.findlyTiles) && extended.findlyTiles.length > 0;
}

export function normalizeFindlyTilePresets(tiles: unknown): FindlyTilePreset[] {
  if (!Array.isArray(tiles)) {
    return [];
  }

  const result: FindlyTilePreset[] = [];

  for (const tile of tiles) {
    if (!tile || typeof tile !== 'object') {
      continue;
    }

    const item = tile as Record<string, unknown>;
    const value = trimString(item.value);

    if (!value) {
      continue;
    }

    const imagePath = trimString(item.imagePath);
    const hexdata = trimString(item.hexdata);

    if (imagePath) {
      result.push({ value, imagePath });
      continue;
    }

    if (hexdata) {
      result.push({ value, hexdata });
      continue;
    }

    result.push({ value });
  }

  return result;
}

export function resolveFindlyTileForValue(value: string, presets: FindlyTilePreset[]): FindlyFilterTile | null {
  const preset = presets.find((entry) => entry.value === value);

  if (!preset) {
    return null;
  }

  if (preset.imagePath) {
    return { imagePath: preset.imagePath };
  }

  if (preset.hexdata) {
    return { hexdata: preset.hexdata };
  }

  return null;
}

export function getFindlyFilterTile(filter: Filter, facet?: FilterGroup | null): FindlyFilterTile | null {
  const extended = filter as FindlyFilterWithTile;
  const tile = extended.findlyTile;

  if (tile?.imagePath) {
    return { imagePath: tile.imagePath };
  }

  if (tile?.hexdata) {
    return { hexdata: tile.hexdata };
  }

  if (!hasFindlyTileFacet(facet)) {
    return null;
  }

  const valueName = trimString(filter.name ?? filter.id);

  return resolveFindlyTileForValue(valueName, facet.findlyTiles ?? []);
}

export function getFindlyTileImagePath(filter: Filter, facet?: FilterGroup | null): string | null {
  return getFindlyFilterTile(filter, facet)?.imagePath ?? null;
}

export function getFindlyTileHexColor(filter: Filter, facet?: FilterGroup | null): string | null {
  const tile = getFindlyFilterTile(filter, facet);

  if (tile?.imagePath) {
    return null;
  }

  return tile?.hexdata ?? null;
}

export function usesFindlyImageTiles(facet: FilterGroup, filters: Filter[]): boolean {
  return filters.some((filter) => Boolean(getFindlyTileImagePath(filter, facet)));
}
