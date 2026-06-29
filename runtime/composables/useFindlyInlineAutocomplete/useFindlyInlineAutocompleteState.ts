import type { ParsedFindlyInlineAutocomplete } from '../../utils/parseFindlyInlineAutocomplete';

export type UseFindlyInlineAutocompleteState = {
  inline: ParsedFindlyInlineAutocomplete | null;
  searchId: string;
};

export const useFindlyInlineAutocompleteState = () =>
  useState<UseFindlyInlineAutocompleteState>('useFindlyInlineAutocomplete', () => ({
    inline: null,
    searchId: '',
  }));
