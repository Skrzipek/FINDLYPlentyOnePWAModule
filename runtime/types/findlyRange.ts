import type { FilterGroup } from '@plentymarkets/shop-api';

export type FindlyRangePreset = {
  key: string;
  from: number;
  to: number;
  count?: number;
};

export type FindlyRangeStats = {
  min: number;
  max: number;
  count?: number;
};

export type FindlyRangeMeta = {
  field: string;
  stats: FindlyRangeStats;
  ranges?: FindlyRangePreset[];
};

export type FindlyFacetWithRange = FilterGroup & {
  findlyRange?: FindlyRangeMeta;
};
