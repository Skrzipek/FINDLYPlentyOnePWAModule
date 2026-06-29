import { useSearch as useThemeSearch } from '~/composables/useSearch/useSearch';
import { useFindlyContext } from '../useFindlyContext';
import { shouldUseFindlySearch } from '../../utils/findlyRouting';
import { useFindlySearch } from './useSearch.findly';

/**
 * Routes to theme useSearch when FINDLY is inactive; uses FINDLY search API only when enabled.
 */
export const useSearch = () => {
  const findly = useFindlyContext();
  const theme = useThemeSearch();
  const findlySearch = useFindlySearch();

  const getSearch = async (params: Parameters<typeof theme.getSearch>[0]) => {
    if (!(await shouldUseFindlySearch(findly))) {
      return theme.getSearch(params);
    }

    return findlySearch.getSearch(params);
  };

  const searchByTag = async (tagId: string, additionalParams?: Parameters<typeof theme.searchByTag>[1]) => {
    if (!(await shouldUseFindlySearch(findly))) {
      return theme.searchByTag(tagId, additionalParams);
    }

    return findlySearch.searchByTag(tagId, additionalParams);
  };

  return {
    getSearch,
    searchByTag,
    data: theme.data,
    loading: theme.loading,
    productsPerPage: theme.productsPerPage,
  };
};
