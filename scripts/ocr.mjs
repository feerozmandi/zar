#!/usr/bin/env node
/**
 * پل اجرایی بخش پایتون (apps/ocr) به ابزارهای مونورپو.
 *
 *   node scripts/ocr.mjs install     # ساخت venv + نصب نیازمندی‌ها
 *   node scripts/ocr.mjs dev         # uvicorn با --reload
 *   node scripts/ocr.mjs test        # pytest
 *   node scripts/ocr.mjs lint        # ruff check + format --check
 *   node scripts/ocr.mjs typecheck   # mypy
 *
 * venv در `apps/ocr/.venv` ساخته می‌شود (gitignore شده) و هیچ وابستگی پایتونی
 * به node_modules ریشه وارد نمی‌شود — دو اکوسیستم، یک نقطه‌ی اجرا.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const ocrDir = path.join(root, "apps/ocr");
const venvDir = process.env.XENNIC_OCR_VENV ?? path.join(ocrDir, ".venv");
const pyBin =
  process.platform === "win32"
    ? path.join(venvDir, "Scripts", "python.exe")
    : path.join(venvDir, "bin", "python");

const command = process.argv[2] ?? "help";
const extraArgs = process.argv.slice(3);

function run(bin, args, options = {}) {
  const result = spawnSync(bin, args, { stdio: "inherit", cwd: ocrDir, ...options });
  if (result.error) {
    console.error(`! اجرای \` ${bin} ${args.join(" ")} \` ممکن نشد: ${result.error.message}`);
    process.exit(1);
  }
  return result.status ?? 1;
}

function ensureVenv() {
  if (existsSync(pyBin)) return 0;
  console.info("· venv ساخته نمی‌شود؛ در حال نصب نیازمندی‌های apps/ocr …");
  const create = run(process.env.PYTHON ?? "python3", ["-m", "venv", venvDir]);
  if (create !== 0) return create;
  const pip = ["-m", "pip", "install", "--quiet", "--upgrade", "pip", "-r", "requirements-dev.txt"];
  const status = run(pyBin, pip);
  if (status !== 0) {
    console.error(
      "! نصب نیازمندی‌ها ناموفق بود. در شبکه‌ی محدود، venv را دستی بسازید و tesseract را نصب کنید.",
    );
  }
  return status;
}

switch (command) {
  case "install": {
    process.exit(ensureVenv());
    break;
  }
  case "dev": {
    process.exit(
      run(pyBin, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000", "--host", "0.0.0.0"]),
    );
    break;
  }
  case "start": {
    process.exit(run(pyBin, ["-m", "uvicorn", "app.main:app", "--port", "8000", "--host", "0.0.0.0"]));
    break;
  }
  case "test": {
    process.exit(ensureVenv() || run(pyBin, ["-m", "pytest", "-q", ...extraArgs]));
    break;
  }
  case "lint": {
    const check = ensureVenv() || run(pyBin, ["-m", "ruff", "check", "app", "tests"]);
    process.exit(check || run(pyBin, ["-m", "ruff", "format", "--check", "app", "tests"]));
    break;
  }
  case "format": {
    process.exit(ensureVenv() || run(pyBin, ["-m", "ruff", "format", "app", "tests"]));
    break;
  }
  case "typecheck": {
    process.exit(ensureVenv() || run(pyBin, ["-m", "mypy", "app"]));
    break;
  }
  default: {
    console.info("کاربرد: node scripts/ocr.mjs <install|dev|start|test|lint|format|typecheck>");
    process.exit(command === "help" ? 0 : 2);
  }
}
