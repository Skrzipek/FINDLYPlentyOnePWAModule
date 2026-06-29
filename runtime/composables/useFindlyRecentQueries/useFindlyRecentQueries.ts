import type { FindlyRecentQueries } from '../../types/findly';
import { findlyGetRecentQueries } from '../../api/plentyFallback';
import { useFindlyContext } from '../useFindlyContext';

type UseFindlyRecentQueriesState = {
  block: FindlyRecentQueries | null;
  loading: boolean;
  guestFetched: boolean;
  requestId: number;
};

export const useFindlyRecentQueries = () => {
  const findly = useFindlyContext();
  const state = useState<UseFindlyRecentQueriesState>('useFindlyRecentQueries', () => ({
    block: null,
    loading: false,
    guestFetched: false,
    requestId: 0,
  }));

  const isEnabled = computed(() => {
    const settings = findly.settings.value;
    if (!findly.isActive.value || !settings) {
      return false;
    }

    return settings.showRecentQueriesPersonal !== false || settings.showRecentQueriesPopular !== false;
  });

  const recentQueriesList = computed(() => state.value.block?.queries ?? []);

  const recentQueriesLabelKey = computed(() => {
    const mode = state.value.block?.mode ?? '';
    return mode === 'popular' ? 'searchBar.recentQueriesPopular' : 'searchBar.recentQueriesPersonal';
  });

  const clearRecentQueries = () => {
    state.value.requestId++;
    state.value.block = null;
    state.value.loading = false;
  };

  const fetchRecentQueries = async (markGuestFetched = false) => {
    if (!isEnabled.value) {
      clearRecentQueries();
      return;
    }

    const requestId = ++state.value.requestId;
    state.value.loading = true;

    try {
      const block = await findlyGetRecentQueries(10);

      if (requestId !== state.value.requestId) {
        return;
      }

      state.value.block = block;

      if (block?.mode === 'popular') {
        state.value.guestFetched = true;
      }
    } catch {
      if (requestId === state.value.requestId) {
        state.value.block = null;
      }
    } finally {
      if (requestId === state.value.requestId) {
        state.value.loading = false;
      }

      if (markGuestFetched) {
        state.value.guestFetched = true;
      }
    }
  };

  const loadRecentQueriesOnFocus = () => {
    if (!isEnabled.value) {
      return;
    }

    const mode = state.value.block?.mode;
    if (mode === 'popular' && state.value.guestFetched) {
      return;
    }

    if (mode === 'personal') {
      void fetchRecentQueries();
      return;
    }

    if (!state.value.guestFetched) {
      void fetchRecentQueries(true);
    }
  };

  return {
    isRecentQueriesEnabled: isEnabled,
    recentQueriesList,
    recentQueriesLabelKey,
    recentQueriesLoading: computed(() => state.value.loading),
    loadRecentQueriesOnFocus,
    clearRecentQueries,
  };
};
