/**
 * @xennic/shared — تنها مرجع منطق مشترک مونورپو.
 * هر چیزی که بیش از یک بخش به آن نیاز دارد باید اینجا اضافه شود، نه در خود بخش‌ها.
 *
 * قاعده‌ی مرزها: هرچه در این فایل export شود، در باندل **کلاینت** وب هم وارد می‌شود
 * (Next/Turbopack barrel را tree-shake نمی‌کند وقتی ماژول side-effect دار باشد).
 * بنابراین ماژول‌های وابسته به Node در barrel نمی‌آیند و با subpath جداگانه مصرف
 * می‌شوند؛ نمونه: @xennic/shared/security (scrypt → node:crypto) که فقط در api و
 * seed استفاده می‌شود. اگر این‌جا می‌آمد، صفحه‌ی /login با خطای
 * `promisify — "original" argument must be of type Function` می‌ترکید.
 */
export * from "./constants.js";
export * from "./env.js";
export * from "./engineering/cable-sizing.js";
export * from "./engineering/capacitor-bank.js";
export * from "./engineering/generator.js";
export * from "./engineering/voltage-drop.js";
export * from "./fa/persian.js";
export * from "./schemas/ai.js";
export * from "./schemas/audit.js";
export * from "./schemas/auth.js";
export * from "./schemas/common.js";
export * from "./schemas/contact.js";
export * from "./schemas/engineering.js";
export * from "./schemas/solar.js";
export * from "./schemas/wiki.js";
export * from "./solar/irradiance.js";
export * from "./solar/roi.js";
