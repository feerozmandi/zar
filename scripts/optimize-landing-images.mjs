#!/usr/bin/env node
/** Rebuild local responsive variants without introducing a runtime image dependency. */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRequire = createRequire(path.join(root, "apps/web/package.json"));
const nextRequire = createRequire(webRequire.resolve("next/package.json"));
const sharp = nextRequire("sharp");
const directory = path.join(root, "apps/web/public/images/landing");

for (const name of ["solar-farm", "power-grid", "electrical-engineering"]) {
  const source = path.join(directory, `${name}.webp`);
  for (const width of [480, 800, 1264]) {
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: 60, effort: 6 })
      .toFile(path.join(directory, `${name}-${width}.avif`));
    if (width < 1264) {
      await sharp(source)
        .resize({ width })
        .webp({ quality: 78, effort: 6 })
        .toFile(path.join(directory, `${name}-${width}.webp`));
    }
  }
  console.info(`Optimized ${name}`);
}
