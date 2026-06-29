import type { ComputedRef } from 'vue';

export type FindlyRoutingContext = {
  ensureReady: () => Promise<void>;
  isActive: ComputedRef<boolean>;
  isSearchEnabled: ComputedRef<boolean>;
  isAutocompleteEnabled: ComputedRef<boolean>;
  isFacetEnabled: ComputedRef<boolean>;
};

export function hasFindlyConfigId(): boolean {
  const config = useRuntimeConfig();

  return Boolean(String(config.public.configId || '').trim());
}

/**
 * Loads FINDLY settings when configId is set; returns false without a network call otherwise.
 */
export async function ensureFindlyActive(findly: FindlyRoutingContext): Promise<boolean> {
  if (!hasFindlyConfigId()) {
    return false;
  }

  await findly.ensureReady();

  return findly.isActive.value;
}

export async function shouldUseFindlySearch(findly: FindlyRoutingContext): Promise<boolean> {
  if (!hasFindlyConfigId()) {
    return false;
  }

  await findly.ensureReady();

  return findly.isSearchEnabled.value;
}

export async function shouldUseFindlyAutocomplete(findly: FindlyRoutingContext): Promise<boolean> {
  if (!hasFindlyConfigId()) {
    return false;
  }

  await findly.ensureReady();

  return findly.isAutocompleteEnabled.value;
}

export async function shouldUseFindlyFacet(findly: FindlyRoutingContext): Promise<boolean> {
  if (!hasFindlyConfigId()) {
    return false;
  }

  await findly.ensureReady();

  return findly.isFacetEnabled.value;
}
