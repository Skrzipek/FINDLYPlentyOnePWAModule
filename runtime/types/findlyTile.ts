import type { Filter, FilterGroup } from '@plentymarkets/shop-api';

export type FindlyTilePreset = {
  value: string;
  imagePath?: string;
  hexdata?: string;
};

export type FindlyFilterTile = {
  imagePath?: string;
  hexdata?: string;
};

export type FindlyFilterWithTile = Filter & {
  findlyTile?: FindlyFilterTile;
};

export type FindlyFacetWithTiles = FilterGroup & {
  findlyTiles?: FindlyTilePreset[];
};
