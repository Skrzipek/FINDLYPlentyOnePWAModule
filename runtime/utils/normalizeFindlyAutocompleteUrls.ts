import type { ItemSearchAutocompleteResult } from '@plentymarkets/shop-api';

type AutocompleteItem = NonNullable<ItemSearchAutocompleteResult['items']>[number] & {
  variationId?: number;
  itemId?: number;
};

export function normalizeFindlyAutocompleteProductUrl(
  url: string,
  variationId?: number,
  itemId?: number,
): string {
  const vid = Number(variationId ?? 0);

  if (vid <= 0 || !url) {
    return url;
  }

  const trimmed = url.replace(/\/$/, '');

  if (/_\d+_\d+$/.test(trimmed)) {
    return url;
  }

  if (/_\d+$/.test(trimmed)) {
    return `${trimmed}_${vid}`;
  }

  const iid = Number(itemId ?? 0);

  if (iid > 0) {
    return `${trimmed}_${iid}_${vid}`;
  }

  return `${trimmed}_${vid}`;
}

export function normalizeFindlyAutocompleteItems(
  items: ItemSearchAutocompleteResult['items'] | undefined,
): ItemSearchAutocompleteResult['items'] {
  if (!items?.length) {
    return items ?? [];
  }

  return items.map((item) => {
    const extended = item as AutocompleteItem;
    const variationId = Number(extended.variationId ?? 0);
    const itemId = Number(extended.itemId ?? 0);

    if (variationId <= 0) {
      return item;
    }

    return {
      ...item,
      url: normalizeFindlyAutocompleteProductUrl(item.url ?? '', variationId, itemId),
    };
  });
}

export function normalizeFindlyAutocompleteResponse<T extends ItemSearchAutocompleteResult>(data: T): T {
  if (!data?.items?.length) {
    return data;
  }

  return {
    ...data,
    items: normalizeFindlyAutocompleteItems(data.items),
  };
}
