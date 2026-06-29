type FindlyFilter = {
  type: 'terms' | 'range';
  values?: string[];
  gte?: number;
  lte?: number;
};

type MapPwaFacetsParams = {
  facets?: string;
  filter?: string;
  priceMin?: string;
  priceMax?: string;
};

const PRICE_FIELD = 'variation_price';

function decodeTermValue(value: string): string {
  return value.replace(/\$minu\$/g, '-').replace(/\$dp\$/g, ':');
}

function encodeCompositeId(field: string, value: string): string {
  return `${field}:${value.replace(/:/g, '$dp$').replace(/-/g, '$minu$')}`;
}

function parseCompositeToken(token: string): [string, string] | null {
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

  return [field, value];
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

function mapFieldValues(field: string, parts: string[]): FindlyFilter | null {
  const values = parts
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== 'undefined' && part.toLowerCase() !== 'null');

  if (!values.length) {
    return null;
  }

  if (values.length === 2 && !Number.isNaN(Number(values[0])) && !Number.isNaN(Number(values[1]))) {
    return {
      type: 'range',
      gte: Number(values[0]),
      lte: Number(values[1]),
    };
  }

  return {
    type: 'terms',
    values,
  };
}

function mapFacetsParam(facets?: string): Record<string, FindlyFilter> {
  if (!facets?.trim()) {
    return {};
  }

  const valuesByField: Record<string, string[]> = {};

  for (const token of facets.split(',')) {
    const parsed = parseCompositeToken(token);
    if (!parsed) {
      continue;
    }

    const [field, value] = parsed;
    valuesByField[field] = valuesByField[field] ?? [];
    valuesByField[field].push(value);
  }

  const filters: Record<string, FindlyFilter> = {};

  for (const [field, values] of Object.entries(valuesByField)) {
    const mapped = mapFieldValues(field, [...new Set(values)]);
    if (mapped) {
      filters[field] = mapped;
    }
  }

  return filters;
}

function mapFilterUrl(filter?: string): Record<string, FindlyFilter> {
  if (!filter?.trim()) {
    return {};
  }

  const filters: Record<string, FindlyFilter> = {};

  for (const segment of splitFilterUrlSegments(filter)) {
    const colonIndex = segment.indexOf(':');
    if (colonIndex <= 0) {
      continue;
    }

    const field = segment.slice(0, colonIndex).trim();
    const rest = segment.slice(colonIndex + 1).trim();
    const parts = rest.split(',').map((part) => decodeTermValue(part.trim())).filter(Boolean);
    const mapped = mapFieldValues(field, parts);

    if (mapped) {
      filters[field] = mapped;
    }
  }

  return filters;
}

function normalizePrice(value?: string): number | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(',', '.');
  if (!normalized || Number.isNaN(Number(normalized))) {
    return null;
  }

  return Number(normalized);
}

function applyPriceRange(filters: Record<string, FindlyFilter>, priceMin?: string, priceMax?: string): Record<string, FindlyFilter> {
  const min = normalizePrice(priceMin);
  const max = normalizePrice(priceMax);

  if (min === null && max === null) {
    return filters;
  }

  const range: FindlyFilter = { type: 'range' };
  if (min !== null) {
    range.gte = min;
  }
  if (max !== null) {
    range.lte = max;
  }

  return {
    ...filters,
    [PRICE_FIELD]: range,
  };
}

export function mapPwaFacetsToFindlyFilters(params: MapPwaFacetsParams): Record<string, FindlyFilter> {
  const fromFilterUrl = mapFilterUrl(params.filter);
  const fromFacets = mapFacetsParam(params.facets);

  return applyPriceRange(
    {
      ...fromFilterUrl,
      ...fromFacets,
    },
    params.priceMin,
    params.priceMax,
  );
}

export function encodeFacetValueForUrl(field: string, value: string): string {
  return encodeCompositeId(field, value);
}
