import type { FilterGroup } from '@plentymarkets/shop-api';
import type { FindlyFacetWithRange, FindlyRangeMeta, FindlyRangePreset } from '../types/findlyRange';

const PRICE_FIELD = 'variation_price';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function hasFindlyRangeMeta(facet?: FilterGroup | null): facet is FindlyFacetWithRange {
  const extended = facet as FindlyFacetWithRange | null | undefined;

  return Boolean(extended?.findlyRange?.stats);
}

export function getFindlyRangeMeta(facet?: FilterGroup | null): FindlyRangeMeta | null {
  if (!hasFindlyRangeMeta(facet)) {
    return null;
  }

  return facet.findlyRange ?? null;
}

export function isFindlyPriceRange(facet?: FilterGroup | null): boolean {
  const meta = getFindlyRangeMeta(facet);

  return meta?.field === PRICE_FIELD;
}

export function normalizeFindlyRangePresets(ranges: unknown): FindlyRangePreset[] {
  if (!Array.isArray(ranges)) {
    return [];
  }

  const result: FindlyRangePreset[] = [];

  for (const range of ranges) {
    if (!range || typeof range !== 'object') {
      continue;
    }

    const item = range as Record<string, unknown>;
    const key = String(item.key ?? '').trim();
    const from = toNumber(item.from, Number.NaN);
    const to = toNumber(item.to, Number.NaN);

    if (!key || Number.isNaN(from) || Number.isNaN(to)) {
      continue;
    }

    const preset: FindlyRangePreset = { key, from, to };

    if (item.doc_count !== undefined) {
      preset.count = toNumber(item.doc_count);
    } else if (item.count !== undefined) {
      preset.count = toNumber(item.count);
    }

    result.push(preset);
  }

  return result;
}

export function getSliderBoundsFromStats(esMin: number, esMax: number): { min: number; max: number } {
  if (!Number.isFinite(esMin) || !Number.isFinite(esMax)) {
    return { min: 0, max: 100 };
  }

  const min = Math.floor(esMin);
  let max = Math.ceil(esMax);

  if (max <= min) {
    max = min + 1;
  }

  return { min, max };
}

export function getSliderStep(min: number, max: number): number {
  const span = Math.max(max - min, 0.01);

  return span >= 100 ? 1 : 0.01;
}

export function clampRangeValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatRangeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Math.round(value * 100) / 100;

  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function parseRangeNumberInput(value: string): number {
  const parsed = Number.parseFloat(value.replace(',', '.').trim());

  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : Number.NaN;
}
