import { useFindlyContext } from '../composables/useFindlyContext';
import { normalizeFindlyLang } from '../api/findlyClient';
import { hasFindlyConfigId } from '../utils/findlyRouting';

export default defineNuxtPlugin(() => {
  if (!hasFindlyConfigId()) {
    return;
  }

  const findly = useFindlyContext();
  const nuxtApp = useNuxtApp();

  if (import.meta.client) {
    void findly.load(String(nuxtApp.$i18n?.locale?.value ?? 'de'));

    watch(
      () => nuxtApp.$i18n?.locale?.value,
      (locale, previousLocale) => {
        if (!locale || previousLocale === undefined) {
          return;
        }

        if (locale === previousLocale) {
          return;
        }

        findly.reset();
        void findly.load(normalizeFindlyLang(String(locale)));
      },
    );
  }
});
