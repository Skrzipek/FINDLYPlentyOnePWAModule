import type { FacetSearchCriteria } from '@plentymarkets/shop-api';
import type { FindlyIdentity } from '../types/findly';
import { getFindlyCustomerPayload, mergeFindlyCustomerIntoBody } from '../utils/getFindlyCustomerPayload';
import { mapPwaFacetsToFindlyFilters } from '../utils/mapPwaFacetsToFindlyFilters';

const FINDLY_FETCH_OPTIONS = {
  credentials: 'include' as const,
};

export function normalizeFindlyLang(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  const match = normalized.match(/^([a-z]{2})/);

  return (match?.[1] ?? normalized.slice(0, 2)) || 'de';
}

export function getFindlyApiBase(): string {
  const config = useRuntimeConfig();
  const endpoint = String(config.public.apiEndpoint || config.public.domain || '').replace(/\/$/, '');

  return `${endpoint}/rest/findly`;
}

export function getFindlyIdentity(lang?: string): FindlyIdentity {
  const config = useRuntimeConfig();
  const nuxtApp = useNuxtApp();
  const locale = lang ?? String(nuxtApp.$i18n?.locale?.value ?? 'de');

  return {
    configId: String(config.public.configId || ''),
    lang: normalizeFindlyLang(locale),
  };
}

export function mapParamsToFindlyBody(params: FacetSearchCriteria & { term?: string; filter?: string }, identity: FindlyIdentity) {
  const filters = mapPwaFacetsToFindlyFilters({
    facets: params.facets,
    filter: params.filter,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
  });

  const customer = getFindlyCustomerPayload();

  return {
    configId: identity.configId,
    lang: identity.lang,
    ...(customer ? { customer } : {}),
    term: params.term,
    query: params.term,
    page: params.page,
    itemsPerPage: params.itemsPerPage,
    perPage: params.itemsPerPage,
    sort: params.sort,
    categoryId: params.categoryId ? Number(params.categoryId) : undefined,
    categoryUrlPath: params.categoryUrlPath,
    categorySlug: params.categorySlug,
    tagId: params.tagId ? Number(params.tagId) : undefined,
    tagName: params.tagName,
    type: params.type,
    facets: params.facets,
    filter: params.filter,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    priceMin: params.priceMin,
    priceMax: params.priceMax,
    crossSellingRelation: params.crossSellingRelation,
    itemId: params.itemId,
  };
}

export async function fetchFindlySettings(identity: FindlyIdentity): Promise<{ active: boolean; settings: import('../types/findly').FindlySettings | null }> {
  if (!identity.configId || !identity.lang) {
    return { active: false, settings: null };
  }

  try {
    const response = await $fetch<{ data: import('../types/findly').FindlySettings }>(`${getFindlyApiBase()}/settings`, {
      query: {
        configId: identity.configId,
        lang: identity.lang,
      },
    });

    const settings = response?.data ?? null;
    const active = settings?.enabled === true;

    return { active, settings };
  } catch {
    // Legacy backends may still return HTTP 404 when FINDLY is inactive.
    return { active: false, settings: null };
  }
}

export async function postFindlySearch<T>(body: Record<string, unknown>): Promise<T> {
  const response = await $fetch<{ data: T }>(`${getFindlyApiBase()}/search`, {
    method: 'POST',
    body: mergeFindlyCustomerIntoBody(body),
    ...FINDLY_FETCH_OPTIONS,
  });

  return response.data;
}

export async function postFindlyFacet<T>(body: Record<string, unknown>): Promise<T> {
  const response = await $fetch<{ data: T }>(`${getFindlyApiBase()}/facet`, {
    method: 'POST',
    body: mergeFindlyCustomerIntoBody(body),
    ...FINDLY_FETCH_OPTIONS,
  });

  return response.data;
}

export async function postFindlyVariationClick(body: Record<string, unknown>): Promise<void> {
  await $fetch(`${getFindlyApiBase()}/events/variation`, {
    method: 'POST',
    body: mergeFindlyCustomerIntoBody(body),
    ...FINDLY_FETCH_OPTIONS,
  });
}

export async function postFindlyInlineComplete(body: Record<string, unknown>): Promise<void> {
  await $fetch(`${getFindlyApiBase()}/events/inline`, {
    method: 'POST',
    body: mergeFindlyCustomerIntoBody(body),
    ...FINDLY_FETCH_OPTIONS,
  });
}
