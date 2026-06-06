export function matchesSearchTerms(
  haystack: string | null | undefined,
  query: string | null | undefined,
): boolean {
  if (!query) return true;
  if (!haystack) return false;
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lower = haystack.toLowerCase();
  return terms.every((term) => lower.includes(term));
}
