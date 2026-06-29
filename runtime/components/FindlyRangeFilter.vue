<template>
  <div class="findly-range-filter mb-4 px-4" data-testid="findly-range-filter">
    <div class="findly-range-filter__slider">
      <div class="findly-range-filter__track" />
      <div class="findly-range-filter__range" :style="rangeStyle" />
      <input
        v-model.number="sliderMin"
        class="findly-range-filter__thumb findly-range-filter__thumb--min"
        type="range"
        :min="bounds.min"
        :max="bounds.max"
        :step="step"
        :aria-label="t('common.labels.min')"
        @input="onSliderMinInput"
      >
      <input
        v-model.number="sliderMax"
        class="findly-range-filter__thumb findly-range-filter__thumb--max"
        type="range"
        :min="bounds.min"
        :max="bounds.max"
        :step="step"
        :aria-label="t('common.labels.max')"
        @input="onSliderMaxInput"
      >
    </div>

    <div class="grid grid-cols-2 gap-3 mt-4">
      <label class="flex flex-col gap-1">
        <UiFormLabel class="text-start">{{ t('common.labels.min') }}</UiFormLabel>
        <SfInput v-model="minInput" type="text" inputmode="decimal" :placeholder="t('common.labels.min')" />
      </label>
      <label class="flex flex-col gap-1">
        <UiFormLabel class="text-start">{{ t('common.labels.max') }}</UiFormLabel>
        <SfInput v-model="maxInput" type="text" inputmode="decimal" :placeholder="t('common.labels.max')" />
      </label>
    </div>

    <div class="flex mt-4">
      <UiButton type="button" class="w-full mr-3 h-10" variant="secondary" @click="applyCurrentRange">
        <template #prefix>
          <SfIconCheck />
        </template>
        {{ t('common.actions.apply') }}
      </UiButton>
      <UiButton
        type="button"
        class="h-10"
        variant="secondary"
        :aria-label="t('common.actions.clear')"
        @click="resetRange"
      >
        <SfIconClose />
      </UiButton>
    </div>

    <div v-if="presets.length" class="flex flex-wrap gap-2 mt-4">
      <UiButton
        v-for="preset in presets"
        :key="preset.key"
        type="button"
        size="sm"
        variant="tertiary"
        class="!px-3"
        @click="applyPreset(preset)"
      >
        {{ preset.key }}
        <SfCounter v-if="preset.count != null" size="sm" class="ml-2">{{ preset.count }}</SfCounter>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterGroup } from '@plentymarkets/shop-api';
import { SfCounter, SfIconCheck, SfIconClose, SfInput } from '@storefront-ui/vue';
import {
  clampRangeValue,
  formatRangeNumber,
  getFindlyRangeMeta,
  getSliderBoundsFromStats,
  getSliderStep,
  hasFindlyRangeMeta,
  parseRangeNumberInput,
} from '../utils/findlyRangeFilter';
import { useFindlyRangeFilter } from '../composables/useFindlyRangeFilter';

const props = defineProps<{
  facet: FilterGroup;
}>();

const { t } = useI18n({ useScope: 'global' });
const { applyRange, clearRange, readPriceRangeFromUrl } = useFindlyRangeFilter();

const meta = computed(() => getFindlyRangeMeta(props.facet));

const bounds = computed(() => {
  const stats = meta.value?.stats;

  return getSliderBoundsFromStats(Number(stats?.min ?? 0), Number(stats?.max ?? 100));
});

const step = computed(() => getSliderStep(bounds.value.min, bounds.value.max));
const presets = computed(() => meta.value?.ranges ?? []);

const sliderMin = ref(bounds.value.min);
const sliderMax = ref(bounds.value.max);
const minInput = ref('');
const maxInput = ref('');

const rangeStyle = computed(() => {
  const span = Math.max(bounds.value.max - bounds.value.min, 1);
  const left = ((sliderMin.value - bounds.value.min) / span) * 100;
  const right = 100 - ((sliderMax.value - bounds.value.min) / span) * 100;

  return {
    left: `${left}%`,
    right: `${right}%`,
  };
});

const syncInputsFromSlider = () => {
  minInput.value = formatRangeNumber(sliderMin.value);
  maxInput.value = formatRangeNumber(sliderMax.value);
};

const syncSliderFromInputs = () => {
  const min = parseRangeNumberInput(minInput.value);
  const max = parseRangeNumberInput(maxInput.value);

  if (Number.isFinite(min)) {
    sliderMin.value = clampRangeValue(min, bounds.value.min, bounds.value.max);
    minInput.value = formatRangeNumber(sliderMin.value);
  }

  if (Number.isFinite(max)) {
    sliderMax.value = clampRangeValue(max, bounds.value.min, bounds.value.max);
    maxInput.value = formatRangeNumber(sliderMax.value);
  }

  if (sliderMin.value > sliderMax.value) {
    const swap = sliderMin.value;
    sliderMin.value = sliderMax.value;
    sliderMax.value = swap;
    minInput.value = formatRangeNumber(sliderMin.value);
    maxInput.value = formatRangeNumber(sliderMax.value);
  }
};

const initializeFromUrlOrStats = () => {
  if (!hasFindlyRangeMeta(props.facet) || !meta.value) {
    return;
  }

  const fromUrl = readPriceRangeFromUrl();
  const hasUrlValues = fromUrl.min !== '' || fromUrl.max !== '';

  if (hasUrlValues) {
    const min = fromUrl.min !== '' ? parseRangeNumberInput(fromUrl.min) : Number.NaN;
    const max = fromUrl.max !== '' ? parseRangeNumberInput(fromUrl.max) : Number.NaN;

    minInput.value = Number.isFinite(min) ? formatRangeNumber(min) : '';
    maxInput.value = Number.isFinite(max) ? formatRangeNumber(max) : '';
    syncSliderFromInputs();

    return;
  }

  sliderMin.value = bounds.value.min;
  sliderMax.value = bounds.value.max;
  syncInputsFromSlider();
};

const onSliderMinInput = () => {
  if (sliderMin.value > sliderMax.value) {
    sliderMin.value = sliderMax.value;
  }

  syncInputsFromSlider();
};

const onSliderMaxInput = () => {
  if (sliderMax.value < sliderMin.value) {
    sliderMax.value = sliderMin.value;
  }

  syncInputsFromSlider();
};

const applyCurrentRange = () => {
  if (!meta.value) {
    return;
  }

  syncSliderFromInputs();
  applyRange(meta.value, sliderMin.value, sliderMax.value);
};

const applyPreset = (preset: { from: number; to: number }) => {
  if (!meta.value) {
    return;
  }

  sliderMin.value = preset.from;
  sliderMax.value = preset.to;
  syncInputsFromSlider();
  applyRange(meta.value, preset.from, preset.to);
};

const resetRange = () => {
  if (!meta.value) {
    return;
  }

  sliderMin.value = bounds.value.min;
  sliderMax.value = bounds.value.max;
  minInput.value = '';
  maxInput.value = '';
  clearRange(meta.value);
};

initializeFromUrlOrStats();

watch(
  () => useRouter().currentRoute.value.query,
  () => initializeFromUrlOrStats(),
);

watch(bounds, () => {
  sliderMin.value = clampRangeValue(sliderMin.value, bounds.value.min, bounds.value.max);
  sliderMax.value = clampRangeValue(sliderMax.value, bounds.value.min, bounds.value.max);
  syncInputsFromSlider();
});
</script>

<style scoped>
.findly-range-filter__slider {
  position: relative;
  height: 1rem;
  margin: 0.5rem 0;
}

.findly-range-filter__track,
.findly-range-filter__range {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  height: 0.25rem;
  border-radius: 9999px;
}

.findly-range-filter__track {
  background: rgb(212 212 212);
}

.findly-range-filter__range {
  background: rgb(23 23 23);
}

.findly-range-filter__thumb {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1rem;
  margin: 0;
  transform: translateY(-50%);
  pointer-events: none;
  appearance: none;
  background: transparent;
}

.findly-range-filter__thumb::-webkit-slider-runnable-track {
  height: 0.25rem;
  background: transparent;
  border: none;
}

.findly-range-filter__thumb::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  width: 1rem;
  height: 1rem;
  margin-top: -0.375rem;
  border-radius: 9999px;
  border: 2px solid rgb(23 23 23);
  background: white;
  cursor: pointer;
}

.findly-range-filter__thumb::-moz-range-track {
  height: 0.25rem;
  background: transparent;
  border: none;
}

.findly-range-filter__thumb::-moz-range-thumb {
  pointer-events: auto;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  border: 2px solid rgb(23 23 23);
  background: white;
  cursor: pointer;
}

.findly-range-filter__thumb--max {
  z-index: 2;
}
</style>
