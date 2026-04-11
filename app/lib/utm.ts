/**
 * Appends UTM tracking parameters to a portal URL.
 * Safe to call on any URL — falls back to original URL if parsing fails.
 */
export function withUtm(url: string, cardId: string, portalName: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "pointsbinder");
    u.searchParams.set("utm_medium", "portal");
    u.searchParams.set("utm_campaign", cardId);
    u.searchParams.set("utm_content", portalName.toLowerCase().replace(/\s+/g, "-"));
    return u.toString();
  } catch {
    return url;
  }
}
