import type { FindlyInlineAutocomplete } from '../types/findly';

export type ParsedFindlyInlineAutocomplete = {
  fullPhrase: string;
  suggestionText: string;
  requestQuery: string;
};

export function parseFindlyInlineAutocomplete(
  inlineAutocomplete: FindlyInlineAutocomplete | null | undefined,
  requestedQuery: string,
  showInlineComplete: boolean,
): ParsedFindlyInlineAutocomplete | null {
  if (!showInlineComplete) {
    return null;
  }

  const hasInline = Boolean(inlineAutocomplete?.enabled && inlineAutocomplete?.data);
  if (!hasInline || !inlineAutocomplete?.data) {
    return null;
  }

  const data = inlineAutocomplete.data;
  const primary = data.primary;
  const alternatives = data.alternatives ?? [];
  const currentQuery = (data.query || requestedQuery || '').toLowerCase().trim();

  let fullPhrase = '';
  let suggestionPart = '';

  if (primary?.full_phrase && primary.full_phrase.toLowerCase() !== currentQuery) {
    fullPhrase = primary.full_phrase;
    suggestionPart =
      primary.suggestion != null ? primary.suggestion : fullPhrase.slice(data.query?.length ?? currentQuery.length) || '';
  }

  if (!fullPhrase && alternatives.length > 0) {
    const alt = alternatives[0];
    fullPhrase = alt?.full_phrase || '';
    suggestionPart =
      alt?.suggestion != null ? alt.suggestion : fullPhrase.slice(data.query?.length ?? currentQuery.length) || '';
  }

  if (!fullPhrase || !suggestionPart) {
    return null;
  }

  return {
    fullPhrase,
    suggestionText: suggestionPart,
    requestQuery: (data.query || requestedQuery || '').trim(),
  };
}
