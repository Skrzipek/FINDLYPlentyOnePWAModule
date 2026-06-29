import type { FilterGroup } from '@plentymarkets/shop-api';
import { facetGetters } from '@plentymarkets/shop-api';
import type { ActiveFilterTag } from '../types/activeFilterTag';
import { formatRangeNumber } from './findlyRangeFilter';

const PRICE_FIELD = 'variation_price';

type ActiveFilterQuery = {
  facets?: string;
  priceMin?: string;
  priceMax?: string;
  filter?: string;
};

function decodeTermValue(value: string): string {
  return value.replace(/\$minu\$/g, '-').replace(/\$dp\$/g, ':');
}

function parseCompositeToken(token: string): { field: string; value: string } | null {
  const trimmed = token.trim();
  const colonIndex = trimmed.indexOf(':');

  if (colonIndex <= 0) {
    return null;
  }

  const field = trimmed.slice(0, colonIndex).trim();
  const value = decodeTermValue(trimmed.slice(colonIndex + 1).trim());

  if (!field || !value) {
    return null;
  }

  return { field, value };
}

function splitFilterUrlSegments(filterStr: string): string[] {
  const raw = filterStr.split('-');
  const merged: string[] = [];
  let buf = '';

  for (const chunk of raw) {
    const trimmed = chunk.trim();
    if (!trimmed) {
      continue;
    }

    if (trimmed.includes(':')) {
      if (buf) {
        merged.push(buf);
      }
      buf = trimmed;
    } else {
      buf = buf ? `${buf}-${trimmed}` : trimmed;
    }
  }

  if (buf) {
    merged.push(buf);
  }

  return merged;
}

function resolveFacetName(facets: FilterGroup[], field: string): string {
  const group = facets.find((facet) => String(facet.id) === field);

  if (group) {
    return facetGetters.getName(group);
  }

  if (field === PRICE_FIELD) {
    const priceFacet = facets.find((facet) => facetGetters.getType(facet) === 'price');

    return priceFacet ? facetGetters.getName(priceFacet) : 'Preis';
  }

  return field;
}

function resolveTermLabel(facets: FilterGroup[], compositeId: string, field: string, value: string): string {
  const group = facets.find((facet) => String(facet.id) === field);
  const match = group?.values?.find((item) => String(item.id) === compositeId);

  return String(match?.name ?? value);
}

function isNumericRange(parts: string[]): boolean {
  return parts.length === 2 && parts.every((part) => part !== '' && Number.isFinite(Number(part)));
}

export function buildActiveFilterTags(facets: FilterGroup[], query: ActiveFilterQuery): ActiveFilterTag[] {
  const tags: ActiveFilterTag[] = [];

  for (const token of query.facets?.split(',').filter(Boolean) ?? []) {
    const parsed = parseCompositeToken(token);

    if (!parsed) {
      continue;
    }

    tags.push({
      key: `term:${token}`,
      facetName: resolveFacetName(facets, parsed.field),
      valueLabel: resolveTermLabel(facets, token, parsed.field, parsed.value),
      type: 'term',
      compositeId: token,
    });
  }

  if (query.priceMin || query.priceMax) {
    const from = query.priceMin ? formatRangeNumber(Number(query.priceMin)) : '0';
    const to = query.priceMax ? formatRangeNumber(Number(query.priceMax)) : '∞';

    tags.push({
      key: 'price',
      facetName: resolveFacetName(facets, PRICE_FIELD),
      valueLabel: `${from} - ${to}`,
      type: 'price',
    });
  }

  for (const segment of splitFilterUrlSegments(query.filter ?? '')) {
    const colonIndex = segment.indexOf(':');

    if (colonIndex <= 0) {
      continue;
    }

    const field = segment.slice(0, colonIndex).trim();
    const rawValue = segment.slice(colonIndex + 1).trim();
    const parts = rawValue.split(',').map((part) => part.trim());

    if (field === PRICE_FIELD) {
      continue;
    }

    if (isNumericRange(parts)) {
      tags.push({
        key: `range:${field}:${parts[0]}:${parts[1]}`,
        facetName: resolveFacetName(facets, field),
        valueLabel: `${formatRangeNumber(Number(parts[0]))} - ${formatRangeNumber(Number(parts[1]))}`,
        type: 'range',
        rangeField: field,
      });

      continue;
    }

    for (const part of parts) {
      const decoded = decodeTermValue(part);

      if (!decoded) {
        continue;
      }

      const compositeId = `${field}:${part}`;

      tags.push({
        key: `filter-term:${compositeId}`,
        facetName: resolveFacetName(facets, field),
        valueLabel: resolveTermLabel(facets, compositeId, field, decoded),
        type: 'term',
        compositeId,
      });
    }
  }

  return tags;
}

export function splitFilterSegments(filterStr: string): string[] {
  return splitFilterUrlSegments(filterStr);
}
