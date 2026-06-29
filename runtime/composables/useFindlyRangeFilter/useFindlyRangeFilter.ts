import type { FindlyRangeMeta } from '../../types/findlyRange';
import { formatRangeNumber } from '../../utils/findlyRangeFilter';

const PRICE_FIELD = 'variation_price';

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

export const useFindlyRangeFilter = () => {
  const route = useRoute();
  const { updatePrices } = useCategoryFilter();

  const applyRange = (meta: FindlyRangeMeta, from: number, to: number): void => {
    const min = Math.min(from, to);
    const max = Math.max(from, to);

    if (meta.field === PRICE_FIELD) {
      updatePrices(formatRangeNumber(min), formatRangeNumber(max));

      return;
    }

    const segment = `${meta.field}:${formatRangeNumber(min)},${formatRangeNumber(max)}`;
    const currentFilter = route.query.filter?.toString() ?? '';
    const segments = splitFilterUrlSegments(currentFilter).filter((part) => !part.startsWith(`${meta.field}:`));
    segments.push(segment);

    const query = { ...route.query, filter: segments.join('-') || null, page: null };

    navigateTo({ query });
  };

  const readPriceRangeFromUrl = (): { min: string; max: string } => {
    const { getFacetsFromURL } = useCategoryFilter();

    return {
      min: getFacetsFromURL().priceMin ?? '',
      max: getFacetsFromURL().priceMax ?? '',
    };
  };

  const clearRange = (meta: FindlyRangeMeta): void => {
    if (meta.field === PRICE_FIELD) {
      updatePrices('', '');

      return;
    }

    const currentFilter = route.query.filter?.toString() ?? '';
    const segments = splitFilterUrlSegments(currentFilter).filter((part) => !part.startsWith(`${meta.field}:`));
    const query = { ...route.query, filter: segments.length ? segments.join('-') : null, page: null };

    navigateTo({ query });
  };

  return {
    applyRange,
    clearRange,
    readPriceRangeFromUrl,
  };
};
