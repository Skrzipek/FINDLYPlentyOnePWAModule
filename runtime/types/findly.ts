export type FindlySettings = {
  configId: string;
  pid: string;
  lang: string;
  enabled: boolean;
  filterUi?: string;
  facetMapping?: unknown[];
  showSuggestions?: boolean;
  autocompleteQuantitySuggestions?: number;
  showCatSuggestions?: boolean;
  autocompleteQuantityCats?: number;
  showDidYouMean?: boolean;
  showInlineComplete?: boolean;
  showRecentQueriesPersonal?: boolean;
  showRecentQueriesPopular?: boolean;
  showVariationId?: boolean;
  showItemId?: boolean;
  showPrice?: boolean;
  showNumber?: boolean;
  onlySearch?: boolean;
  useDevMode?: boolean;
  logBasketAdd?: boolean;
  logPurchaseComplete?: boolean;
};

export type FindlyIdentity = {
  configId: string;
  lang: string;
};

export type FindlyContextState = {
  loaded: boolean;
  loading: boolean;
  active: boolean;
  lang: string;
  settings: FindlySettings | null;
};

export type FindlyDidYouMeanSuggestion = {
  text: string;
  score?: number;
  distance?: number;
};

export type FindlyDidYouMean = {
  results: FindlyDidYouMeanSuggestion[];
  total: number;
  enabled: boolean;
  triggered: boolean;
};

export type FindlySearchBanner = {
  found: boolean;
  link: string;
  image: string;
  alt: string;
  title: string;
};

export type FindlySearchExtras = {
  didYouMean?: FindlyDidYouMean;
  banner?: FindlySearchBanner;
  inlineAutocomplete?: FindlyInlineAutocomplete;
  recentQueries?: FindlyRecentQueries;
};

export type FindlyRecentQuery = {
  query: string;
  normalized_query?: string;
};

export type FindlyRecentQueries = {
  mode?: string;
  limit?: number;
  timeRange?: string;
  minCount?: number | null;
  queries: FindlyRecentQuery[];
};

export type FindlyAutocompleteAssistMeta = {
  searchId?: string;
  findlyCategoryId?: string;
};

export type FindlyAutocompleteItem = {
  variationId?: number;
  itemId?: number;
  number?: string;
};

export type FindlyInlineAutocompletePhrase = {
  full_phrase?: string;
  suggestion?: string;
};

export type FindlyInlineAutocomplete = {
  enabled?: boolean;
  data?: {
    query?: string;
    normalized_query?: string;
    primary?: FindlyInlineAutocompletePhrase;
    alternatives?: FindlyInlineAutocompletePhrase[];
  };
};
