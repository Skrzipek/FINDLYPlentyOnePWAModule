import type { ItemSearchParams, ItemSearchResult } from '@plentymarkets/shop-api';
import { FINDLY_DEFAULTS } from '../../constants';
import { findlyGetSearch, handleComposableError, plentyGetSearch } from '../../api/plentyFallback';

type UseSearchState = {
  data: ItemSearchResult;
  loading: boolean;
  productsPerPage: number;
};

/**
 * FINDLY search implementation – only invoked when settings are active (router decides).
 */
export const useFindlySearch = () => {
  const state = useState<UseSearchState>('search', () => ({
    data: {} as ItemSearchResult,
    loading: false,
    productsPerPage: FINDLY_DEFAULTS.DEFAULT_ITEMS_PER_PAGE,
  }));

  const getSearch = async (params: ItemSearchParams) => {
    try {
      state.value.loading = true;

      let data: ItemSearchResult | undefined;

      try {
        data = await findlyGetSearch(params);
      } catch (error) {
        handleComposableError(error);
        data = await plentyGetSearch(params);
      }

      state.value.productsPerPage = params.itemsPerPage || FINDLY_DEFAULTS.DEFAULT_ITEMS_PER_PAGE;
      state.value.data = data ?? state.value.data;
    } catch (error) {
      handleComposableError(error);
    } finally {
      state.value.loading = false;
    }

    return state.value.data;
  };

  const searchByTag = async (tagId: string, additionalParams: ItemSearchParams = {}) => {
    const params: ItemSearchParams = {
      ...additionalParams,
      type: 'tag',
      tagId,
    };

    return await getSearch(params);
  };

  return {
    getSearch,
    searchByTag,
    ...toRefs(state.value),
  };
};
