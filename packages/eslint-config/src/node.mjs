import { base } from "./base.mjs";

/** پیکربندی بخش‌های سمت سرور (NestJS، بسته‌های داده و ابزارها). */
export function node(config = {}) {
  return base({
    rules: {
      // در NestJS تزوابستگی از طریق decoratorها انجام می‌شود و این الگو رایج است
      "@typescript-eslint/no-extraneous-class": "off",
      ...(config.rules ?? {}),
    },
    extraIgnores: config.extraIgnores ?? [],
  });
}

export default node;
