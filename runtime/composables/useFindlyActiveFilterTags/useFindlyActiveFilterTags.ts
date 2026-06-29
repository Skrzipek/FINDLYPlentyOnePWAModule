import type { ActiveFilterTag } from '../../types/activeFilterTag';
import { buildActiveFilterTags, splitFilterSegments } from '../../utils/activeFilterTags';

export const useFindlyActiveFilterTags = () => {
  const route = useRoute();
  const { data: productsCatalog } = useProducts();
  const { getFacetsFromURL, updateFilters, updatePrices, updateQuery } = useCategoryFilter();

  const tags = computed(() => {
    const url = getFacetsFromURL();

    return buildActiveFilterTags(productsCatalog.value.facets ?? [], {
      facets: url.facets,
      priceMin: url.priceMin,
      priceMax: url.priceMax,
      filter: route.query.filter?.toString(),
    });
  });

  const hasActiveFilters = computed(() => tags.value.length > 0);

  const removeTag = (tag: ActiveFilterTag): void => {
    if (tag.type === 'term' && tag.compositeId) {
      updateFilters({ [tag.compositeId]: false });
      updateQuery({ page: null });

      return;
    }

    if (tag.type === 'price') {
      updatePrices('', '');
      updateQuery({ page: null });

      return;
    }

    if (tag.type === 'range' && tag.rangeField) {
      const currentFilter = route.query.filter?.toString() ?? '';
      const segments = splitFilterSegments(currentFilter).filter((part) => !part.startsWith(`${tag.rangeField}:`));

      updateQuery({
        filter: segments.length ? segments.join('-') : null,
        page: null,
      });
    }
  };

  const clearAllTags = (): void => {
    updateQuery({
      facets: null,
      priceMin: null,
      priceMax: null,
      filter: null,
      page: null,
    });
  };

  return {
    tags,
    hasActiveFilters,
    removeTag,
    clearAllTags,
  };
};
