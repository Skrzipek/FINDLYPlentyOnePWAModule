import { useProducts as useThemeProducts } from '~/composables/useProducts/useProducts';
import { useFindlyContext } from '../useFindlyContext';
import { shouldUseFindlyFacet } from '../../utils/findlyRouting';
import { useFindlyProducts } from './useProducts.findly';

/**
 * Routes to theme useProducts when FINDLY is inactive; uses FINDLY facet API only when enabled.
 */
export const useProducts = (category = '') => {
  const findly = useFindlyContext();
  const theme = useThemeProducts(category);
  const findlyProducts = useFindlyProducts(category);
  const usingFindlyFacet = ref(false);

  const fetchProducts = async (params: Parameters<typeof theme.fetchProducts>[0]) => {
    if (!(await shouldUseFindlyFacet(findly))) {
      usingFindlyFacet.value = false;

      return theme.fetchProducts(params);
    }

    usingFindlyFacet.value = true;

    return findlyProducts.fetchProducts(params);
  };

  return {
    fetchProducts,
    setCurrentProduct: theme.setCurrentProduct,
    loadFakeGlobalCategoryData: theme.loadFakeGlobalCategoryData,
    data: computed(() => (usingFindlyFacet.value ? findlyProducts.data.value : theme.data.value)),
    loading: computed(() => (usingFindlyFacet.value ? findlyProducts.loading.value : theme.loading.value)),
    productsPerPage: computed(() =>
      usingFindlyFacet.value ? findlyProducts.productsPerPage.value : theme.productsPerPage.value,
    ),
    currentProduct: computed(() =>
      usingFindlyFacet.value ? findlyProducts.currentProduct.value : theme.currentProduct.value,
    ),
  };
};
