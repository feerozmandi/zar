/**
 * الزام پیام کامیت قراردادی — مطابق CONTRIBUTING.md §۳
 * types مجاز: feat fix docs style refactor perf test ci build chore revert
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "ci", "build", "chore", "revert", "ai"],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
  },
};
