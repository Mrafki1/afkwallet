/** Convert a display name to a URL-safe slug. */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Find the canonical display name for a given slug by checking
 * it against a list of known names.
 */
export function nameFromSlug(slug: string, names: string[]): string | null {
  return names.find(n => slugify(n) === slug) ?? null;
}
