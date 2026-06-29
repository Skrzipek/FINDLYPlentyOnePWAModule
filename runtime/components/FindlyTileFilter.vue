<template>
  <div class="findly-tile-filter mb-4 px-4" data-testid="findly-tile-filter">
    <div
      class="findly-tile-filter__grid"
      :class="{
        'findly-tile-filter__grid--image': showImageTiles,
        'findly-tile-filter__grid--color': !showImageTiles,
      }"
    >
      <SfTooltip
        v-for="filter in filters"
        :key="String(filter.id)"
        :label="tooltipLabel(filter)"
        strategy="absolute"
        :show-arrow="true"
        placement="top"
      >
        <button
          type="button"
          class="findly-tile-filter__item"
          :class="{
            'findly-tile-filter__item--selected': isSelected(filter),
            'findly-tile-filter__item--image': Boolean(getImagePath(filter)),
            'findly-tile-filter__item--color': Boolean(getHexColor(filter)),
            'findly-tile-filter__item--text': !getImagePath(filter) && !getHexColor(filter),
          }"
          :aria-pressed="isSelected(filter)"
          :aria-label="filter.name ?? ''"
          @click="toggleFilter(filter)"
        >
          <NuxtImg
            v-if="getImagePath(filter)"
            :src="getImagePath(filter)!"
            :alt="filter.name ?? ''"
            class="findly-tile-filter__image"
            loading="lazy"
          />
          <span
            v-else-if="getHexColor(filter)"
            class="findly-tile-filter__swatch"
            :style="{ backgroundColor: getHexColor(filter) ?? undefined }"
          />
          <span v-else class="findly-tile-filter__label">{{ filter.name ?? '' }}</span>
        </button>
      </SfTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Filter, FilterGroup } from '@plentymarkets/shop-api';
import { facetGetters } from '@plentymarkets/shop-api';
import { SfTooltip } from '@storefront-ui/vue';
import type { Filters } from '../types/filters';
import {
  getFindlyTileHexColor,
  getFindlyTileImagePath,
  usesFindlyImageTiles,
} from '../utils/findlyTileFilter';

const props = defineProps<{
  facet: FilterGroup;
}>();

const { getFacetsFromURL, updateFilters } = useCategoryFilter();

const filters = computed(() => facetGetters.getFilters(props.facet) as Filter[]);
const models = ref({} as Filters);

const showImageTiles = computed(() => usesFindlyImageTiles(props.facet, filters.value));

const getImagePath = (filter: Filter) => getFindlyTileImagePath(filter, props.facet);
const getHexColor = (filter: Filter) => getFindlyTileHexColor(filter, props.facet);

const isSelected = (filter: Filter) => Boolean(models.value[String(filter.id)]);

const tooltipLabel = (filter: Filter) => filter.name ?? '';

const syncFromUrl = () => {
  const currentFacets = getFacetsFromURL().facets?.split(',') ?? [];

  for (const filter of filters.value) {
    const filterId = String(filter.id);
    models.value[filterId] = currentFacets.includes(filterId);
  }
};

const toggleFilter = (filter: Filter) => {
  const filterId = String(filter.id);
  models.value[filterId] = !models.value[filterId];
  updateFilters(models.value);
};

syncFromUrl();

watch(
  () => useRouter().currentRoute.value.query,
  () => syncFromUrl(),
);
</script>

<style scoped>
.findly-tile-filter__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.findly-tile-filter__grid--image {
  gap: 0.75rem;
}

.findly-tile-filter__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgb(212 212 212);
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.findly-tile-filter__item:hover {
  border-color: rgb(115 115 115);
}

.findly-tile-filter__item--selected {
  border-color: rgb(23 23 23);
  box-shadow: 0 0 0 1px rgb(23 23 23);
}

.findly-tile-filter__item--image {
  width: 4.5rem;
  min-height: 4.5rem;
  padding: 0.375rem;
  flex-direction: column;
}

.findly-tile-filter__item--color {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0.125rem;
  border-radius: 9999px;
}

.findly-tile-filter__item--text {
  min-height: 2.5rem;
  padding: 0.375rem 0.75rem;
}

.findly-tile-filter__image {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: contain;
}

.findly-tile-filter__swatch {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 9999px;
  border: 1px solid rgb(212 212 212);
}

.findly-tile-filter__label {
  font-size: 0.875rem;
  line-height: 1.25rem;
  text-align: center;
}
</style>
