/**
 * Free-tier guard for every OpenRouter caller in the bot.
 *
 * Free tiers get public text only (.claude/rules/claude-usage.md): OpenRouter
 * does not state per-model provider training for `:free`, and ZOE's OpenRouter
 * paths carry private context (DMs, board items, vault and Bonfire recall).
 * Each caller runs `assertNotFreeTier(model)` before building or sending a
 * prompt, so a free-tier override fails loudly instead of leaking.
 */

/**
 * True when any colon-separated suffix of the model id is `free`, so stacked
 * variants (`vendor/model:free:online`, `:nitro:free`) count too.
 */
export function isFreeTierModel(modelId: string): boolean {
  return modelId
    .trim()
    .split(':')
    .slice(1)
    .some((segment) => segment.trim().toLowerCase() === 'free');
}

/** Throws before any request is built when the model id is a free tier. */
export function assertNotFreeTier(modelId: string): void {
  if (isFreeTierModel(modelId)) {
    throw new Error(`refusing free-tier model ${modelId}: this path carries private content`);
  }
}
