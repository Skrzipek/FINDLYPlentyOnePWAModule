import type { Filter, FilterGroup, Product } from '@plentymarkets/shop-api';
import type { FindlyFacetWithRange } from '../types/findlyRange';
import type { FindlyFacetWithTiles } from '../types/findlyTile';
import { normalizeFindlyRangePresets } from './findlyRangeFilter';
import { normalizeFindlyTilePresets } from './findlyTileFilter';

const FINDLY_TERM_TYPES = new Set(['terms', 'value', 'text']);

function encodeFilterTermValue(value: string): string {
  return value.replace(/:/g, '$dp$').replace(/-/g, '$minu$');
}

function encodeCompositeId(field: string, value: string): string {
  return `${field}:${encodeFilterTermValue(value)}`;
}

function isCompositeId(id: string, field: string): boolean {
  return id.startsWith(`${field}:`);
}

function mapPwaFilterType(findlyType: string, field: string): string {
  const fieldLower = field.toLowerCase();

  if (fieldLower === 'variation_price') {
    return 'price';
  }

  if (fieldLower.includes('producer') || fieldLower.includes('manufacturer')) {
    return 'producer';
  }

  if (fieldLower.includes('availability')) {
    return 'availability';
  }

  if (fieldLower === 'feedback' || fieldLower.startsWith('feedback-')) {
    return 'feedback';
  }

  return 'dynamic';
}

function normalizeFilterGroup(group: FilterGroup): FilterGroup {
  const extended = group as FindlyFacetWithRange;
  const field = String(group.id ?? '');
  const findlyType = String(group.type ?? 'value');

  if (extended.findlyRange?.stats) {
    const isPrice = field.toLowerCase() === 'variation_price';

    return {
      ...group,
      type: isPrice ? 'price' : 'findly-range',
      values: [],
      count: extended.findlyRange.stats.count ?? group.count ?? 0,
      findlyRange: {
        field: extended.findlyRange.field || field,
        stats: {
          min: Number(extended.findlyRange.stats.min ?? 0),
          max: Number(extended.findlyRange.stats.max ?? 0),
          count: extended.findlyRange.stats.count,
        },
        ranges: normalizeFindlyRangePresets(extended.findlyRange.ranges),
      },
    } as FindlyFacetWithRange;
  }

  const pwaType = mapPwaFilterType(findlyType, field);

  if (pwaType === 'price') {
    return {
      ...group,
      type: 'price',
      values: [],
      count: 0,
    };
  }

  const values = (group.values ?? []).map((filter: Filter) => {
    const rawId = String(filter.id ?? filter.name ?? '');
    const id =
      FINDLY_TERM_TYPES.has(findlyType) && field !== '' && !isCompositeId(rawId, field)
        ? encodeCompositeId(field, rawId)
        : rawId;

    return {
      ...filter,
      id,
    };
  });

  const tileExtended = group as FindlyFacetWithTiles;

  return {
    ...group,
    type: pwaType,
    values,
    count: values.length,
    ...(tileExtended.findlyTiles?.length
      ? { findlyTiles: normalizeFindlyTilePresets(tileExtended.findlyTiles) }
      : {}),
  } as FilterGroup;
}

export function normalizeFindlyFacetsForPwa(facets: FilterGroup[] | undefined | null): FilterGroup[] {
  if (!facets?.length) {
    return [];
  }

  return facets.map(normalizeFilterGroup);
}

function normalizeFindlyProductLink(product: Product): Product {
  const variationId = Number(product?.variation?.id ?? 0);
  if (variationId <= 0) {
    return product;
  }

  const salableCount = Number(product?.item?.salableVariationCount ?? 0);
  const hasGroupedAttributes = (product?.groupedAttributes?.length ?? 0) > 0;
  if (salableCount === 1 || hasGroupedAttributes) {
    return product;
  }

  return {
    ...product,
    item: {
      ...product.item,
      salableVariationCount: 1,
    },
  };
}

function normalizeFindlyProducts(products: Product[] | undefined | null): Product[] {
  if (!products?.length) {
    return products ?? [];
  }

  return products.map(normalizeFindlyProductLink);
}

export function normalizeFindlyFacetResponse<T extends { facets?: FilterGroup[]; products?: Product[] }>(data: T): T {
  if (!data?.facets?.length && !data?.products?.length) {
    return data;
  }

  return {
    ...data,
    ...(data.facets?.length ? { facets: normalizeFindlyFacetsForPwa(data.facets) } : {}),
    ...(data.products?.length ? { products: normalizeFindlyProducts(data.products) } : {}),
  };
}
