import type { FindlySettings, FindlySearchExtras } from '../../types/findly';
import type { ItemSearchAutocompleteResult } from '@plentymarkets/shop-api';
import { findlyGetAutocomplete, handleComposableError, plentyGetAutocomplete } from '../../api/plentyFallback';
import { useFindlyContext } from '../useFindlyContext';
import { useFindlyInlineAutocomplete } from '../useFindlyInlineAutocomplete';

const CATEGORY_LIMIT = 5;
const SUGGESTIONS_LIMIT = 5;
const ITEMS_LIMIT = 4;

type UseSearchSuggestionsState = {
  results: ItemSearchAutocompleteResult | null;
  searchTerm: string;
  loading: boolean;
  currentRequestId: number;
};

/**
 * FINDLY autocomplete implementation – only invoked when settings are active (router decides).
 */
export const useFindlySearchSuggestions = () => {
  const findly = useFindlyContext();
  const { clearInlineAutocomplete, applyInlineAutocompleteFromResponse } = useFindlyInlineAutocomplete();
  const state = useState<UseSearchSuggestionsState>('useSearchSuggestions', () => ({
    results: null,
    searchTerm: '',
    loading: false,
    currentRequestId: 0,
  }));

  const applyLimits = (data: ItemSearchAutocompleteResult, settings: FindlySettings | null) => {
    const categoryLimit = settings?.autocompleteQuantityCats ?? CATEGORY_LIMIT;
    const suggestionLimit = settings?.autocompleteQuantitySuggestions ?? SUGGESTIONS_LIMIT;

    data.categories = data.categories?.slice(0, categoryLimit) ?? [];
    data.suggestions = data.suggestions?.slice(0, suggestionLimit) ?? [];
    data.items = data.items?.slice(0, ITEMS_LIMIT) ?? [];

    if (settings?.showCatSuggestions === false) {
      data.categories = [];
    }

    if (settings?.showSuggestions === false) {
      data.suggestions = [];
    }

    return data;
  };

  const searchSuggestions = async (text: string) => {
    const term = text.trim().slice(0, 80);

    if (term.length < 2) {
      state.value.currentRequestId++;
      state.value.results = null;
      state.value.loading = false;
      clearInlineAutocomplete();

      return;
    }

    if (state.value.searchTerm === term) {
      if (state.value.results) {
        applyInlineAutocompleteFromResponse(
          state.value.results as ItemSearchAutocompleteResult & FindlySearchExtras,
          term,
        );
      }

      return;
    }

    const requestId = ++state.value.currentRequestId;
    state.value.loading = true;
    clearInlineAutocomplete();

    try {
      let data: ItemSearchAutocompleteResult | undefined;

      try {
        data = await findlyGetAutocomplete(term);
      } catch (error) {
        handleComposableError(error);
        data = await plentyGetAutocomplete(term);
      }

      if (data && requestId === state.value.currentRequestId) {
        const limited = applyLimits(data, findly.settings.value);
        state.value.searchTerm = term;
        state.value.results = limited;
        applyInlineAutocompleteFromResponse(limited as ItemSearchAutocompleteResult & FindlySearchExtras, term);
      }
    } catch (error) {
      handleComposableError(error);
    } finally {
      if (requestId === state.value.currentRequestId) {
        state.value.loading = false;
      }
    }
  };

  const resetSuggestions = () => {
    state.value.currentRequestId++;
    state.value.results = null;
    state.value.searchTerm = '';
    state.value.loading = false;
    clearInlineAutocomplete();
  };

  return {
    results: computed(() => state.value.results),
    searchTerm: computed(() => state.value.searchTerm),
    loading: computed(() => state.value.loading),
    searchSuggestions,
    resetSuggestions,
  };
};
