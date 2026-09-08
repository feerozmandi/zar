"use client";

import {
  DEFAULT_BID_WEIGHTS,
  evaluateBids,
  provinceLabel,
  summarizeLead,
  type BidEvaluation,
  type BidWeights,
  type EpcBidInput,
} from "@xennic/shared";
import { useMemo, useState } from "react";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";
import { z } from "zod";
import { compactNumber, compactToman } from "@/lib/solar/format";
import { loadAssessmentId, loadDraft } from "@/lib/solar/draft";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

const epcResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  preferredSchedule: z.string(),
});

const EMPTY_BID: EpcBidInput = {
  partnerName: "",
  totalPriceToman: 900_000_000,
  capacityKwp: 30,
  moduleBrand: "",
  moduleTier: 1,
  inverterBrand: "",
  productWarrantyYears: 12,
  performanceWarrantyPercent: 84,
  rating: 4,
  leadTimeDays: 60,
  oAndMYears: 5,
};

/**
 * مارکت‌پلیسِ EPC — مدل EnergySage:
 * مشتری مشخصات پروژه را یک‌بار ثبت می‌کند و چند پیمانکار پیشنهاد می‌دهند؛
 * سیستم پیشنهادها را فقط بر اساس قیمت رتبه‌بندی نمی‌کند، بلکه رده‌ی پنل،
 * گارانتی، رتبه‌ی کارفرمایان و زمان تحویل را هم وزن می‌دهد.
 */
export function EpcMarketplace() {
  const router = useRouter();
  const draft = useMemo(() => loadDraft(), []);
  const authStatus = useAuthStore((state) => state.status);
  const setPostLoginRedirect = useAuthStore((state) => state.setPostLoginRedirect);
  const [bids, setBids] = useState<EpcBidInput[]>([
    {
      ...EMPTY_BID,
      partnerName: "پیمانکار نمونه الف",
      totalPriceToman: 1_050_000_000,
      capacityKwp: 30,
      moduleTier: 1,
      moduleBrand: "Tier-1 مونو",
      productWarrantyYears: 12,
      performanceWarrantyPercent: 87,
      rating: 4.6,
      leadTimeDays: 45,
    },
    {
      ...EMPTY_BID,
      partnerName: "پیمانکار نمونه ب",
      totalPriceToman: 880_000_000,
      capacityKwp: 30,
      moduleTier: 3,
      moduleBrand: "بدون رده",
      productWarrantyYears: 5,
      performanceWarrantyPercent: 80,
      rating: 2.8,
      leadTimeDays: 120,
    },
  ]);
  const [draftBid, setDraftBid] = useState<EpcBidInput>(EMPTY_BID);
  const [weights, setWeights] = useState<BidWeights>(DEFAULT_BID_WEIGHTS);
  const [contact, setContact] = useState({ name: "", phone: "" });
  const [submitState, setSubmitState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const ranked = useMemo(() => evaluateBids(bids, weights), [bids, weights]);

  function addBid(): void {
    if (draftBid.partnerName.trim().length < 2) return;
    setBids((current) => [...current, { ...draftBid }]);
    setDraftBid({ ...EMPTY_BID, capacityKwp: draftBid.capacityKwp });
  }

  function removeBid(index: number): void {
    setBids((current) => current.filter((_, item) => item !== index));
  }

  async function submitRequest(): Promise<void> {
    if (authStatus !== "authenticated") {
      setPostLoginRedirect("/solar/marketplace");
      router.push("/login?next=/solar/marketplace");
      return;
    }
    setSubmitState("sending");
    setMessage(null);
    const assessmentId = loadAssessmentId();
    if (!assessmentId) {
      setSubmitState("error");
      setMessage("ابتدا گزارش را در صفحه‌ی «طرح توجیهی» ذخیره کنید تا درخواست به پیمانکاران ارجاع شود.");
      return;
    }
    try {
      await apiFetch("solar/epc-request", epcResponseSchema, {
        method: "POST",
        body: { assessmentId, contactName: contact.name, contactPhone: contact.phone },
      });
      const lead = summarizeLead({
        requestId: assessmentId,
        province: draft.site.province,
        capacityKwp: ranked[0]?.capacityKwp ?? 0,
        annualConsumptionKwh: draft.consumption.monthlyKwh.reduce((sum, value) => sum + value, 0),
        annualProductionKwh: 0,
        contactName: contact.name,
        contactPhone: contact.phone,
        preferredSchedule: "quarter",
      });
      setSubmitState("sent");
      setMessage(
        `درخواست ثبت شد. پیمانکاران پروژه را به‌صورت ناشناس می‌بینند: ${lead.contactMasked.name} — ${lead.contactMasked.phone}`,
      );
    } catch (error) {
      setSubmitState("error");
      setMessage(error instanceof Error ? error.message : "ارسال ناموفق بود");
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="bg-card/60">
        <CardContent className="grid gap-3 p-5">
          <h3 className="text-sm font-bold">خلاصه‌ی پروژه‌ای که برای پیمانکاران فرستاده می‌شود</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <Stat label="استان" value={provinceLabel(draft.site.province)} />
            <Stat label="مساحت سقف" value={`${compactNumber(draft.roof.areaM2 ?? 0)} m²`} />
            <Stat
              label="مصرف سالانه"
              value={`${compactNumber(draft.consumption.monthlyKwh.reduce((sum, value) => sum + value, 0))} kWh`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            اطلاعات تماسِ شما تا زمانی که خودتان انتخاب نکنید، برای پیمانکاران پوشانده می‌ماند (مدل
            EnergySage).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardContent className="grid gap-3 p-5">
            <h3 className="text-sm font-bold">افزودن پیشنهاد</h3>
            <TextRow
              id="partner"
              label="نام پیمانکار"
              onChange={(value) => setDraftBid((current) => ({ ...current, partnerName: value }))}
              value={draftBid.partnerName}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberRow
                id="price"
                label="مبلغ کل (تومان)"
                onChange={(value) => setDraftBid((current) => ({ ...current, totalPriceToman: value }))}
                step={10_000_000}
                value={draftBid.totalPriceToman}
              />
              <NumberRow
                id="capacity"
                label="ظرفیت (kWp)"
                onChange={(value) => setDraftBid((current) => ({ ...current, capacityKwp: value }))}
                step={1}
                value={draftBid.capacityKwp}
              />
              <div className="grid gap-1.5">
                <Label htmlFor="tier">رده‌ی پنل</Label>
                <select
                  className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  id="tier"
                  onChange={(event) =>
                    setDraftBid((current) => ({
                      ...current,
                      moduleTier: Number(event.target.value) as 1 | 2 | 3,
                    }))
                  }
                  value={draftBid.moduleTier ?? 2}
                >
                  <option value={1}>Tier-1</option>
                  <option value={2}>Tier-2</option>
                  <option value={3}>Tier-3 / نامشخص</option>
                </select>
              </div>
              <NumberRow
                id="warranty"
                label="گارانتی محصول (سال)"
                onChange={(value) => setDraftBid((current) => ({ ...current, productWarrantyYears: value }))}
                step={1}
                value={draftBid.productWarrantyYears ?? 10}
              />
              <NumberRow
                id="rating"
                label="رتبه (۰ تا ۵)"
                onChange={(value) => setDraftBid((current) => ({ ...current, rating: value }))}
                step={0.1}
                value={draftBid.rating ?? 3}
              />
              <NumberRow
                id="lead"
                label="زمان تحویل (روز)"
                onChange={(value) => setDraftBid((current) => ({ ...current, leadTimeDays: value }))}
                step={5}
                value={draftBid.leadTimeDays ?? 90}
              />
            </div>
            <Button onClick={addBid} type="button" variant="outline">
              افزودن به مقایسه
            </Button>

            <h3 className="mt-2 text-sm font-bold">وزنِ معیارها</h3>
            {(Object.keys(DEFAULT_BID_WEIGHTS) as Array<keyof BidWeights>).map((key) => (
              <div className="grid gap-1" key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span>{WEIGHT_LABELS[key]}</span>
                  <span className="xennic-numeric">{compactNumber(weights[key], 2)}</span>
                </div>
                <input
                  className="h-1.5 w-full accent-primary"
                  max={1}
                  min={0}
                  onChange={(event) =>
                    setWeights((current) => ({ ...current, [key]: Number(event.target.value) }))
                  }
                  step={0.05}
                  type="range"
                  value={weights[key]}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 p-5">
            <h3 className="text-sm font-bold">رتبه‌بندی پیشنهادها</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="p-2 text-right">رتبه</th>
                    <th className="p-2 text-right">پیمانکار</th>
                    <th className="p-2 text-right">تومان/وات</th>
                    <th className="p-2 text-right">امتیاز</th>
                    <th className="p-2 text-right">اختلاف قیمت</th>
                    <th className="p-2 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {bids.map((bid, index) => {
                    const evaluation = ranked.find(
                      (item) => item.id === bid.id || item.partnerName === bid.partnerName,
                    );
                    if (!evaluation) return null;
                    return (
                      <BidRow
                        bid={evaluation}
                        key={bid.id ?? `bid-${index}`}
                        onRemove={() => removeBid(index)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2">
              {ranked.map((bid) => (
                <div
                  className={`rounded-lg border p-3 text-xs leading-6 ${
                    bid.isBestValue ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}
                  key={`detail-${bid.id}`}
                >
                  <p className="font-bold">
                    {bid.partnerName}
                    {bid.isBestValue ? <span className="mr-2 text-primary">بهترین ارزش</span> : null}
                  </p>
                  <p className="text-muted-foreground">
                    قیمت {compactToman(bid.totalPriceToman)} · {compactNumber(bid.pricePerWattToman)}{" "}
                    تومان/وات · امتیاز {compactNumber(bid.scores.total, 3)}
                  </p>
                  {bid.warnings.length ? (
                    <ul className="mt-1 text-amber-600">
                      {bid.warnings.map((warning) => (
                        <li key={warning}>! {warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>

            <h3 className="mt-2 text-sm font-bold">ارسال درخواست</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextRow
                id="contact-name"
                label="نام و نام خانوادگی"
                onChange={(value) => setContact((current) => ({ ...current, name: value }))}
                value={contact.name}
              />
              <TextRow
                id="contact-phone"
                label="شماره تماس"
                onChange={(value) => setContact((current) => ({ ...current, phone: value }))}
                value={contact.phone}
              />
            </div>
            <Button onClick={() => void submitRequest()} type="button">
              ارسال برای پیمانکاران
            </Button>
            {message ? (
              <p className={`text-xs ${submitState === "error" ? "text-destructive" : "text-emerald-600"}`}>
                {message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const WEIGHT_LABELS: Record<keyof BidWeights, string> = {
  price: "قیمت",
  equipment: "کیفیت تجهیزات",
  warranty: "گارانتی",
  rating: "رتبه‌ی کارفرمایان",
  schedule: "زمان‌بندی",
};

function BidRow({ bid, onRemove }: { bid: BidEvaluation; onRemove: () => void }) {
  return (
    <tr className={`border-b border-border/50 ${bid.isBestValue ? "bg-primary/5" : ""}`}>
      <td className="xennic-numeric p-2">{bid.rank}</td>
      <td className="p-2 font-semibold">{bid.partnerName}</td>
      <td className="xennic-numeric p-2">{compactNumber(bid.pricePerWattToman)}</td>
      <td className="xennic-numeric p-2">{compactNumber(bid.scores.total, 3)}</td>
      <td className="xennic-numeric p-2">
        {bid.priceDeltaVsCheapestPercent === 0
          ? "ارزان‌ترین"
          : `+${compactNumber(bid.priceDeltaVsCheapestPercent, 1)}٪`}
      </td>
      <td className="p-2">
        <button className="text-xs text-destructive underline" onClick={onRemove} type="button">
          حذف
        </button>
      </td>
    </tr>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="xennic-numeric text-sm font-bold">{value}</p>
    </div>
  );
}

function TextRow({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} onChange={(event) => onChange(event.target.value)} value={value} />
    </div>
  );
}

function NumberRow({
  id,
  label,
  onChange,
  step = 1,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        dir="ltr"
        id={id}
        inputMode="decimal"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        step={step}
        type="number"
        value={value}
      />
    </div>
  );
}
