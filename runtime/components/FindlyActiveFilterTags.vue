<template>
  <div v-if="hasActiveFilters" class="findly-active-filter-tags mb-4" data-testid="findly-active-filter-tags">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tag in tags"
        :key="tag.key"
        type="button"
        class="findly-active-filter-tags__item"
        :aria-label="`${tag.facetName}: ${tag.valueLabel}`"
        @click="removeTag(tag)"
      >
        <SfIconClose class="findly-active-filter-tags__icon" size="xs" />
        <span>
          <span class="font-bold">{{ tag.facetName }}:</span>
          {{ tag.valueLabel }}
        </span>
      </button>

      <button type="button" class="findly-active-filter-tags__item" @click="clearAllTags">
        {{ t('search.clearFilters') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SfIconClose } from '@storefront-ui/vue';
import { useFindlyActiveFilterTags } from '../composables/useFindlyActiveFilterTags';

const { t } = useI18n({ useScope: 'global' });
const { tags, hasActiveFilters, removeTag, clearAllTags } = useFindlyActiveFilterTags();
</script>

<style scoped>
.findly-active-filter-tags__item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid rgb(212 212 212);
  border-radius: 0.125rem;
  background: white;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: rgb(23 23 23);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.findly-active-filter-tags__item:hover {
  border-color: rgb(115 115 115);
  background: rgb(250 250 250);
}

.findly-active-filter-tags__icon {
  flex-shrink: 0;
}
</style>
