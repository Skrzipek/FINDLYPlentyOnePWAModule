import type { FindlyContextState } from '../../types/findly';
import { fetchFindlySettings, getFindlyIdentity, normalizeFindlyLang } from '../../api/findlyClient';
import { hasFindlyConfigId } from '../../utils/findlyRouting';

const STATE_KEY = 'findly-context';

type SettingsResult = Awaited<ReturnType<typeof fetchFindlySettings>>;

export const useFindlyContext = () => {
  const state = useState<FindlyContextState>(STATE_KEY, () => ({
    loaded: false,
    loading: false,
    active: false,
    lang: '',
    settings: null,
  }));

  let pending: Promise<void> | null = null;

  const applySettings = (normalizedLang: string, result: SettingsResult) => {
    state.value = {
      loaded: true,
      loading: false,
      active: result.active,
      lang: normalizedLang,
      settings: result.settings,
    };
  };

  const load = async (lang: string) => {
    if (!hasFindlyConfigId()) {
      return;
    }

    const normalizedLang = normalizeFindlyLang(lang);

    if (state.value.loaded && state.value.lang === normalizedLang && !state.value.loading) {
      return;
    }

    if (pending) {
      await pending;

      return;
    }

    state.value.loading = true;

    pending = (async () => {
      const identity = getFindlyIdentity(normalizedLang);
      const cacheKey = `findly-settings-${identity.configId}-${identity.lang}`;

      const { data: result } = await useAsyncData(cacheKey, () => fetchFindlySettings(identity));

      applySettings(normalizedLang, result.value ?? { active: false, settings: null });
    })();

    try {
      await pending;
    } finally {
      pending = null;
      state.value.loading = false;
    }
  };

  const ensureReady = async () => {
    const nuxtApp = useNuxtApp();
    const locale = String(nuxtApp.$i18n?.locale?.value ?? 'de');

    await load(locale);
  };

  const isActive = computed(() => state.value.active && state.value.settings?.enabled === true);

  const isSearchEnabled = computed(() => isActive.value);

  const isAutocompleteEnabled = computed(() => isActive.value);

  const isFacetEnabled = computed(() => isActive.value && state.value.settings?.onlySearch !== true);

  const reset = () => {
    state.value = {
      loaded: false,
      loading: false,
      active: false,
      lang: '',
      settings: null,
    };
    pending = null;
  };

  return {
    state: readonly(state),
    settings: computed(() => state.value.settings),
    isActive,
    isSearchEnabled,
    isAutocompleteEnabled,
    isFacetEnabled,
    ensureReady,
    load,
    reset,
  };
};
