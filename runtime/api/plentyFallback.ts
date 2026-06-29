import type { ApiError, Facet, FacetSearchCriteria, ItemSearchAutocompleteResult, ItemSearchParams, ItemSearchResult } from '@plentymarkets/shop-api';
import type { FindlyRecentQueries } from '../types/findly';
import { FINDLY_DEFAULTS } from '../constants';
import { getFindlyIdentity, mapParamsToFindlyBody, postFindlyFacet, postFindlySearch } from './findlyClient';
import { normalizeFindlyFacetResponse } from '../utils/normalizeFindlyFacetsForPwa';
import { normalizeFindlyAutocompleteResponse } from '../utils/normalizeFindlyAutocompleteUrls';

export async function plentyGetSearch(params: ItemSearchParams): Promise<ItemSearchResult | undefined> {
  if (!params.type) {
    params.type = 'search';
  }

  const { data } = await useSdk().plentysystems.getSearch(params);

  if (data) {
    data.pagination.perPageOptions = FINDLY_DEFAULTS.PER_PAGE_STEPS;
  }

  return data;
}

export async function plentyGetFacet(params: FacetSearchCriteria): Promise<Facet | null> {
  const response = await useSdk().plentysystems.getFacet(params);
  const facet = response?.data ?? null;

  if (facet?.pagination) {
    facet.pagination.perPageOptions = FINDLY_DEFAULTS.PER_PAGE_STEPS;
  }

  return facet;
}

export async function plentyGetAutocomplete(query: string): Promise<ItemSearchAutocompleteResult | undefined> {
  const { data } = await useSdk().plentysystems.getItemSearchAutocomplete({
    query,
    types: ['suggestion', 'category'],
  });

  return data;
}

export async function findlyGetSearch(params: ItemSearchParams): Promise<ItemSearchResult> {
  const identity = getFindlyIdentity();
  const body = mapParamsToFindlyBody(params, identity);
  const data = normalizeFindlyFacetResponse(await postFindlySearch<ItemSearchResult>(body));

  if (data?.pagination) {
    data.pagination.perPageOptions = FINDLY_DEFAULTS.PER_PAGE_STEPS;
  }

  return data;
}

export async function findlyGetFacet(params: FacetSearchCriteria): Promise<Facet> {
  const identity = getFindlyIdentity();
  const body = mapParamsToFindlyBody(params, identity);
  const data = normalizeFindlyFacetResponse(await postFindlyFacet<Facet>(body));

  if (data?.pagination) {
    data.pagination.perPageOptions = FINDLY_DEFAULTS.PER_PAGE_STEPS;
  }

  return data;
}

export async function findlyGetAutocomplete(query: string): Promise<ItemSearchAutocompleteResult> {
  const identity = getFindlyIdentity();
  const data = await postFindlySearch<ItemSearchAutocompleteResult>({
    ...mapParamsToFindlyBody({ term: query }, identity),
    autocomplete: true,
    mode: 'autocomplete',
    getInlineAutocomplete: true,
  });

  return normalizeFindlyAutocompleteResponse(data);
}

export async function findlyGetRecentQueries(limit = 10): Promise<FindlyRecentQueries | null> {
  const identity = getFindlyIdentity();
  const data = await postFindlySearch<{ recentQueries?: FindlyRecentQueries }>({
    configId: identity.configId,
    lang: identity.lang,
    getRecentQueries: true,
    recentQueriesLimit: limit,
  });

  const block = data?.recentQueries;
  if (!block?.queries?.length) {
    return null;
  }

  return block;
}

export function handleComposableError(error: unknown): void {
  useHandleError(error as ApiError);
}
