/**
 * Ping a healthcheck URL to signal a cron job completed successfully.
 * Uses env vars — if the var isn't set the call is a no-op.
 *
 * Recommended service: https://healthchecks.io (free tier, no credit card)
 * Set one URL per cron job in Vercel environment variables.
 */
export async function pingHealthcheck(envVar: string): Promise<void> {
  const url = process.env[envVar];
  if (!url) return;
  try {
    await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) });
  } catch {
    // Non-fatal — never let a healthcheck failure break the cron job
  }
}
