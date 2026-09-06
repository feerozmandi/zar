import { node } from "@xennic/eslint-config/node";

export default node({
  extraIgnores: ["dist/**"],
  rules: {
    // دی‌آی در Nest با پارامترهای تزشده‌ی استفاده‌نشده (مثلاً فقط برای ترتیب ماژول) رایج است
    "@typescript-eslint/no-unused-expressions": "off",
    "no-console": "off",
  },
});
