import type { ItemSearchAutocompleteItem } from '@plentymarkets/shop-api';
import { useSearchSuggestions as useThemeSearchSuggestions } from '~/composables/useSearch/useSearchSuggestions';
import type { FindlyAutocompleteAssistMeta, FindlyAutocompleteItem } from '../../types/findly';
import { useFindlyContext } from '../useFindlyContext';
import { shouldUseFindlyAutocomplete } from '../../utils/findlyRouting';
import { useFindlyAutocompleteAssist } from '../useFindlyAutocompleteAssist';
import { useFindlyInlineAutocomplete } from '../useFindlyInlineAutocomplete';
import { useFindlyRecentQueries } from '../useFindlyRecentQueries';
import { useFindlySearchSuggestions } from './useSearchSuggestions.findly';

type TrackAutocompleteVariationClickParams = {
  item: ItemSearchAutocompleteItem & FindlyAutocompleteItem;
  index: number;
};

/**
 * Routes to theme useSearchSuggestions when FINDLY is inactive.
 */
export const useSearchSuggestions = () => {
  const findly = useFindlyContext();
  const theme = useThemeSearchSuggestions();
  const findlySuggestions = useFindlySearchSuggestions();
  const { canTrackVariationClick, trackVariationClick } = useFindlyAutocompleteAssist();
  const inlineAutocomplete = useFindlyInlineAutocomplete();
  const recentQueries = useFindlyRecentQueries();

  const activeResults = computed(() =>
    findly.isActive.value ? findlySuggestions.results.value : theme.results.value,
  );
  const activeSearchTerm = computed(() =>
    findly.isActive.value ? findlySuggestions.searchTerm.value : theme.searchTerm.value,
  );
  const activeLoading = computed(() =>
    findly.isActive.value ? findlySuggestions.loading.value : theme.loading.value,
  );

  const searchSuggestions = async (text: string) => {
    if (!(await shouldUseFindlyAutocomplete(findly))) {
      return theme.searchSuggestions(text);
    }

    return findlySuggestions.searchSuggestions(text);
  };

  const resetSuggestions = () => {
    theme.resetSuggestions();
    findlySuggestions.resetSuggestions();
    inlineAutocomplete.clearInlineAutocomplete();
  };

  const trackAutocompleteVariationClick = ({
    item,
    index,
  }: TrackAutocompleteVariationClickParams): void => {
    if (!canTrackVariationClick()) {
      return;
    }

    const assistResults = theme.results.value as {
      searchId?: string;
      findlyCategoryId?: string;
      items?: unknown[];
    } | null;

    const assist: FindlyAutocompleteAssistMeta = {
      searchId: assistResults?.searchId,
      findlyCategoryId: assistResults?.findlyCategoryId,
    };

    void trackVariationClick({
      item,
      index,
      requestQuery: theme.searchTerm.value,
      itemTotal: assistResults?.items?.length ?? 0,
      assist,
    });
  };

  return {
    results: activeResults,
    searchTerm: activeSearchTerm,
    loading: activeLoading,
    searchSuggestions,
    resetSuggestions,
    canTrackAutocompleteVariationClick: canTrackVariationClick,
    trackAutocompleteVariationClick,
    ...inlineAutocomplete,
    ...recentQueries,
  };
};
