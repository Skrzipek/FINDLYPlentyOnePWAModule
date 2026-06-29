import type { Facet, FacetSearchCriteria, Product } from '@plentymarkets/shop-api';
import { FINDLY_DEFAULTS } from '../../constants';
import { findlyGetFacet, handleComposableError, plentyGetFacet } from '../../api/plentyFallback';

type UseProductsState = {
  data: Facet;
  loading: boolean;
  productsPerPage: number;
  currentProduct: Product;
};

/**
 * FINDLY facet implementation – only invoked when settings are active (router decides).
 */
export const useFindlyProducts = (category = '') => {
  const state = useState<UseProductsState>(`useProducts${category}`, () => ({
    data: {} as Facet,
    loading: false,
    productsPerPage: FINDLY_DEFAULTS.DEFAULT_ITEMS_PER_PAGE,
    currentProduct: {} as Product,
  }));

  const fetchProducts = async (params: FacetSearchCriteria) => {
    state.value.loading = true;

    if (params.categoryUrlPath?.endsWith('.js')) {
      state.value.loading = false;

      return state.value.data;
    }

    const identifier = category || params.categoryUrlPath || params.categoryId;

    try {
      const fetcher = async (): Promise<Facet | null> => {
        try {
          return await findlyGetFacet(params);
        } catch (error) {
          handleComposableError(error);

          return await plentyGetFacet(params);
        }
      };

      const { data } = await useAsyncData(`useProducts-${identifier}-${JSON.stringify(params)}`, fetcher);

      state.value.productsPerPage = params.itemsPerPage || FINDLY_DEFAULTS.DEFAULT_ITEMS_PER_PAGE;

      if (data.value) {
        state.value.data = data.value;
      }
    } catch (error) {
      handleComposableError(error);
    } finally {
      state.value.loading = false;
    }

    return state.value.data;
  };

  const setCurrentProduct = async (product: Product) => {
    state.value.loading = true;
    state.value.currentProduct = product;
    state.value.loading = false;
  };

  return {
    fetchProducts,
    setCurrentProduct,
    data: computed(() => state.value.data),
    loading: computed(() => state.value.loading),
    productsPerPage: computed(() => state.value.productsPerPage),
    currentProduct: computed(() => state.value.currentProduct),
  };
};
