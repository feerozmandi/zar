/**
 * ابزار مرجع: طبقه‌بندی ولتاژ شبکه و مشخصات نامی تجهیز (رنج تجهیز بر اساس ولتاژ سیستم).
 * وقتی یک سطح ولتاژ سیستم انتخاب می‌شود، این ابزار Um، ولتاژ ضربه‌ی صاعقه و سطح
 * کاربرد را مطابق IEC 60038 / IEC 62271 و سطوح ولتاژ شبکه‌ی ایران برمی‌گرداند.
 */

import { refs, VOLTAGE_CLASS_RATINGS, type StandardNote } from "./standards.js";

export interface VoltageClassInfo {
  nominalKv: number;
  systemLabelFa: string;
  umKv: number;
  lightningImpulseKv: number;
  usageFa: string;
}

export interface VoltageClassResult {
  selected: VoltageClassInfo | null;
  /** رنج‌های مجاز تجهیز برای ولتاژ انتخابی */
  notesFa: string[];
  all: VoltageClassInfo[];
  standards: StandardNote[];
}

export function voltageClassInfo(nominalKv: number): VoltageClassResult {
  const row = VOLTAGE_CLASS_RATINGS.find((v) => Math.abs(v.nominalKv - nominalKv) < 0.05) ?? null;
  return {
    selected: row
      ? {
          nominalKv: row.nominalKv,
          systemLabelFa: row.systemLabelFa,
          umKv: row.umKv,
          lightningImpulseKv: row.lightningImpulseKv,
          usageFa: row.usageFa,
        }
      : null,
    notesFa: row
      ? [
          `ولتاژ نامی شبکه: ${row.nominalKv} کیلوولت — تجهیزات این سطح باید حداقل ولتاژ نامی (rated) معادل ${row.umKv} کیلوولت (Um) داشته باشند.`,
          `مقاومت عایقی تجهیز در برابر صاعقه (BIL/LIWL) در این سطح معمولاً ${row.lightningImpulseKv} کیلوولت پیک است.`,
          `کاربرد در ایران: ${row.usageFa}.`,
        ]
      : ["سطح ولتاژ داده‌شده در جدول مرجع یافت نشد؛ نزدیک‌ترین سطح استاندارد (IEC 60038) را برگزینید."],
    all: VOLTAGE_CLASS_RATINGS,
    standards: refs(["IEC60038", "IEC62271", "TAVANIR_NET"]),
  };
}

/** نسخه‌ی بدون پارامتر که کل جدول طبقه‌بندی ولتاژ و تجهیز را برمی‌گرداند */
export function voltageClassTable(): VoltageClassResult {
  return {
    selected: null,
    notesFa: ["جدول کامل طبقه‌بندی سطوح ولتاژ و مشخصات نامی تجهیز در پایین آمده است."],
    all: VOLTAGE_CLASS_RATINGS,
    standards: refs(["IEC60038", "IEC62271", "TAVANIR_NET"]),
  };
}
