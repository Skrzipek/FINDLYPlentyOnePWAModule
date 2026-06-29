import type { ItemSearchAutocompleteItem } from '@plentymarkets/shop-api';
import type { FindlyAutocompleteAssistMeta, FindlyAutocompleteItem } from '../../types/findly';
import { getFindlyIdentity, postFindlyVariationClick } from '../../api/findlyClient';
import { useFindlyContext } from '../useFindlyContext';

type TrackVariationClickParams = {
  item: ItemSearchAutocompleteItem & FindlyAutocompleteItem;
  index: number;
  requestQuery: string;
  itemTotal: number;
  assist: FindlyAutocompleteAssistMeta;
};

export const useFindlyAutocompleteAssist = () => {
  const findly = useFindlyContext();

  const canTrackVariationClick = () => findly.isActive.value && findly.isAutocompleteEnabled.value;

  const trackVariationClick = async ({
    item,
    index,
    requestQuery,
    itemTotal,
    assist,
  }: TrackVariationClickParams): Promise<void> => {
    if (!canTrackVariationClick()) {
      return;
    }

    const variationId = Number(item.variationId ?? 0);
    const itemId = Number(item.itemId ?? 0);

    if (variationId <= 0) {
      return;
    }

    const identity = getFindlyIdentity();

    try {
      await postFindlyVariationClick({
        configId: identity.configId,
        lang: identity.lang,
        searchId: assist.searchId ?? '',
        findlyCategoryId: assist.findlyCategoryId ?? '',
        requestQuery,
        term: requestQuery,
        variation: {
          position: index + 1,
          total: itemTotal,
          request_query: requestQuery,
          variation_name: item.label,
          variation_item_id: itemId,
          variation_id: variationId,
          variation_external_id: '',
          variation_number: item.number ?? '',
        },
      });
    } catch {
      // Assist tracking must not block navigation.
    }
  };

  return {
    canTrackVariationClick,
    trackVariationClick,
  };
};
