-- ═══════════════════════════════════════════════════════════════════════════
--  مایگریشن: ماژول امکان‌سنجی نیروگاه خورشیدی (فاز نخستِ داده)
--  این نخستین مایگریشنِ مخزن است و فقط «جدول‌های جدید» می‌افزاید؛ بنابراین
--  روی پایگاه‌داده‌ای که با `prisma db push` ساخته شده نیز امن است.
--  نکته: شناسه‌ها در Prisma از نوع String(uuid) هستند و به ستون TEXT نگاشت
--  می‌شوند (مقدار پیش‌فرض سمت کلاینت ساخته می‌شود)؛ بنابراین در اینجا هم TEXT است.
--  پس از اعمال، `pnpm db:generate` را اجرا کنید تا کلاینتِ Prisma با
--  مدل‌های جدید بازتولید شود (پوشه‌ی src/generated کامیت نمی‌شود).
-- ═══════════════════════════════════════════════════════════════════════════

-- CreateEnum
CREATE TYPE "EpcBidStatus" AS ENUM ('SUBMITTED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- ──────────────────────────── ایستگاه‌های اقلیمی ────────────────────────────
CREATE TABLE "climate_stations" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "elevationM" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualGhiKwhM2Day" DOUBLE PRECISION NOT NULL,
    "monthlyGhiKwhM2Day" JSONB,
    "annualTempC" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'estimated',
    "measuredFrom" TIMESTAMP(3),
    "measuredTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "climate_stations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "climate_stations_name_lat_lon_key" ON "climate_stations"("name", "lat", "lon");
CREATE INDEX "climate_stations_province_isActive_idx" ON "climate_stations"("province", "isActive");

-- ─────────────────────── بنچمارک هزینه‌ی احداث ────────────────────────────
CREATE TABLE "solar_cost_benchmarks" (
    "id" TEXT NOT NULL,
    "minKwp" DOUBLE PRECISION NOT NULL,
    "maxKwp" DOUBLE PRECISION,
    "capexPerKwpToman" DOUBLE PRECISION NOT NULL,
    "opexPerKwpToman" DOUBLE PRECISION,
    "note" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "solar_cost_benchmarks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "solar_cost_benchmarks_isActive_effectiveFrom_idx" ON "solar_cost_benchmarks"("isActive", "effectiveFrom");

-- ─────────────────────── نرخ‌های سیاستی خورشیدی ───────────────────────────
CREATE TABLE "solar_policy_presets" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "legalRef" TEXT,
    "exportPriceTomanPerKwh" DOUBLE PRECISION NOT NULL,
    "offsetPriceTomanPerKwh" DOUBLE PRECISION,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "solar_policy_presets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "solar_policy_presets_scenarioId_isActive_effectiveFrom_idx" ON "solar_policy_presets"("scenarioId", "isActive", "effectiveFrom");

-- ─────────────────────── صفحات ترسیم‌شده‌ی سقف ────────────────────────────
CREATE TABLE "solar_roof_planes" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'سقف اصلی',
    "polygon" JSONB NOT NULL,
    "tiltDeg" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "azimuthDeg" DOUBLE PRECISION NOT NULL DEFAULT 180,
    "obstacles" JSONB,
    "setbackM" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "grossAreaM2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usableAreaM2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "panelCount" INTEGER NOT NULL DEFAULT 0,
    "capacityKwp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solarAccess" DOUBLE PRECISION,
    "layout" JSONB,

    CONSTRAINT "solar_roof_planes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "solar_roof_planes_assessmentId_idx" ON "solar_roof_planes"("assessmentId");

-- ─────────────────────── طراحی سیستم (تجهیزات) ───────────────────────────
CREATE TABLE "solar_designs" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "moduleModel" TEXT NOT NULL,
    "moduleWatt" INTEGER NOT NULL,
    "panelCount" INTEGER NOT NULL,
    "capacityKwp" DOUBLE PRECISION NOT NULL,
    "inverterModel" TEXT NOT NULL,
    "inverterCount" INTEGER NOT NULL DEFAULT 1,
    "acKw" DOUBLE PRECISION NOT NULL,
    "dcAcRatio" DOUBLE PRECISION NOT NULL,
    "modulesPerString" INTEGER NOT NULL,
    "stringCount" INTEGER NOT NULL,
    "unusedModules" INTEGER NOT NULL DEFAULT 0,
    "performanceRatio" DOUBLE PRECISION NOT NULL,
    "losses" JSONB,
    "monthlyCellTempC" JSONB,

    CONSTRAINT "solar_designs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "solar_designs_assessmentId_key" ON "solar_designs"("assessmentId");

-- ─────────────────────── تولید و ترازِ ماهانه ────────────────────────────
CREATE TABLE "solar_production_profiles" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "monthlyAcKwh" JSONB NOT NULL,
    "monthlyPoaKwhM2Day" JSONB NOT NULL,
    "monthlyAccess" JSONB,
    "monthlyPeakKw" JSONB,
    "annualAcKwh" DOUBLE PRECISION NOT NULL,
    "specificYieldKwhPerKwp" DOUBLE PRECISION NOT NULL,
    "capacityFactor" DOUBLE PRECISION NOT NULL,
    "clippingLoss" DOUBLE PRECISION NOT NULL,
    "monthlyHourlyShape" JSONB,

    CONSTRAINT "solar_production_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "solar_production_profiles_assessmentId_key" ON "solar_production_profiles"("assessmentId");

-- ─────────────────────── نتایج سناریوهای نظارتی ──────────────────────────
CREATE TABLE "solar_scenarios" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "offsetPriceTomanPerKwh" DOUBLE PRECISION NOT NULL,
    "exportPriceTomanPerKwh" DOUBLE PRECISION NOT NULL,
    "selfConsumptionShare" DOUBLE PRECISION NOT NULL,
    "annualSavingToman" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "annualExportRevenueToman" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capexToman" DOUBLE PRECISION NOT NULL,
    "npvToman" DOUBLE PRECISION NOT NULL,
    "irr" DOUBLE PRECISION,
    "mirr" DOUBLE PRECISION,
    "lcoeTomanPerKwh" DOUBLE PRECISION NOT NULL,
    "paybackYears" DOUBLE PRECISION,
    "discountedPaybackYears" DOUBLE PRECISION,
    "lifetimeGenerationKwh" DOUBLE PRECISION NOT NULL,
    "co2AvoidedTons" DOUBLE PRECISION NOT NULL,
    "cashflow" JSONB,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "solar_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "solar_scenarios_assessmentId_scenarioId_key" ON "solar_scenarios"("assessmentId", "scenarioId");
CREATE INDEX "solar_scenarios_scenarioId_npvToman_idx" ON "solar_scenarios"("scenarioId", "npvToman");

-- ─────────────────────── پیشنهادهای پیمانکاران ───────────────────────────
CREATE TABLE "epc_bids" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "partnerId" TEXT,
    "partnerName" TEXT NOT NULL,
    "totalPriceToman" DOUBLE PRECISION NOT NULL,
    "capacityKwp" DOUBLE PRECISION NOT NULL,
    "pricePerWattToman" DOUBLE PRECISION NOT NULL,
    "moduleBrand" TEXT,
    "moduleTier" INTEGER,
    "inverterBrand" TEXT,
    "productWarrantyYears" INTEGER,
    "performanceWarrantyPercent" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "leadTimeDays" INTEGER,
    "oAndMYears" INTEGER,
    "notes" TEXT,
    "scores" JSONB,
    "rank" INTEGER,
    "status" "EpcBidStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epc_bids_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "epc_bids_requestId_partnerName_key" ON "epc_bids"("requestId", "partnerName");
CREATE INDEX "epc_bids_requestId_rank_idx" ON "epc_bids"("requestId", "rank");

-- ──────────────────────────── کلیدهای خارجی ──────────────────────────────
ALTER TABLE "solar_roof_planes" ADD CONSTRAINT "solar_roof_planes_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "solar_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "solar_designs" ADD CONSTRAINT "solar_designs_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "solar_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "solar_production_profiles" ADD CONSTRAINT "solar_production_profiles_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "solar_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "solar_scenarios" ADD CONSTRAINT "solar_scenarios_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "solar_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "epc_bids" ADD CONSTRAINT "epc_bids_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "epc_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "epc_bids" ADD CONSTRAINT "epc_bids_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "epc_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
