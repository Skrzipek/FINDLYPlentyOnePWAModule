import type { FindlyInlineAutocomplete, FindlySearchExtras } from '../../types/findly';
import { getFindlyIdentity, postFindlyInlineComplete } from '../../api/findlyClient';
import { parseFindlyInlineAutocomplete } from '../../utils/parseFindlyInlineAutocomplete';
import { useFindlyContext } from '../useFindlyContext';
import { useFindlyInlineAutocompleteState } from './useFindlyInlineAutocompleteState';

export const useFindlyInlineAutocomplete = () => {
  const findly = useFindlyContext();
  const state = useFindlyInlineAutocompleteState();

  const clearInlineAutocomplete = () => {
    state.value.inline = null;
    state.value.searchId = '';
  };

  const isInlineAutocompleteEnabled = computed(
    () => findly.isActive.value && findly.isAutocompleteEnabled.value && findly.settings.value?.showInlineComplete !== false,
  );

  const showInlineSuggestion = computed(
    () => isInlineAutocompleteEnabled.value && Boolean(state.value.inline?.suggestionText),
  );

  const applyInlineAutocompleteFromResponse = (
    response: ({ searchId?: string } & FindlySearchExtras) | null | undefined,
    requestedQuery: string,
  ) => {
    if (!isInlineAutocompleteEnabled.value) {
      clearInlineAutocomplete();
      return;
    }

    state.value.inline = parseFindlyInlineAutocomplete(response?.inlineAutocomplete, requestedQuery, true);
    state.value.searchId = String(response?.searchId ?? '');
  };

  const acceptInlineAutocomplete = async (onAccepted: (phrase: string) => void) => {
    const current = state.value.inline;
    if (!current?.fullPhrase) {
      return;
    }

    const selectedPhrase = current.fullPhrase;
    const requestQuery = current.requestQuery;
    const searchId = state.value.searchId;

    const applyPhrase = () => {
      clearInlineAutocomplete();
      onAccepted(selectedPhrase);
    };

    if (!searchId) {
      applyPhrase();
      return;
    }

    try {
      const identity = getFindlyIdentity();
      await postFindlyInlineComplete({
        configId: identity.configId,
        lang: identity.lang,
        searchId,
        inline: {
          selected: selectedPhrase,
          request_query: requestQuery || selectedPhrase,
        },
      });
    } catch {
      // Assist tracking must not block input updates.
    }

    applyPhrase();
  };

  return {
    inlineAutocomplete: computed(() => state.value.inline),
    showInlineSuggestion,
    isInlineAutocompleteEnabled,
    clearInlineAutocomplete,
    acceptInlineAutocomplete,
    applyInlineAutocompleteFromResponse,
  };
};
