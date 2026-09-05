import { base } from "./base.mjs";

/**
 * پیکربندی بسته‌های React (پکیج UI).
 * قوانین مخصوص Next.js در خود apps/web با eslint-config-next افزوده می‌شوند.
 */
export function react(config = {}) {
  return base({
    extraIgnores: config.extraIgnores ?? [],
    rules: {
      ...(config.rules ?? {}),
    },
  });
}

export default react;
