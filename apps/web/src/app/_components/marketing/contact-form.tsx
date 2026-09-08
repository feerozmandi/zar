"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { contactRequestSchema, contactResponseSchema, type ContactRequestInput } from "@xennic/shared";
import { ArrowUpLeft, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { apiFetch, ApiError } from "@/lib/api-client";
import styles from "./contact-form.module.css";

export function ContactForm({
  initialTopic = "engineering",
}: {
  initialTopic?: ContactRequestInput["topic"];
}) {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof contactRequestSchema>, unknown, ContactRequestInput>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: { topic: initialTopic },
  });

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  async function onSubmit(values: ContactRequestInput) {
    setSubmitError(null);
    try {
      await apiFetch("contact", contactResponseSchema, { method: "POST", body: values, timeoutMs: 15_000 });
      setSent(true);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError && error.status === 429
          ? "تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید و دوباره تلاش کنید."
          : "درخواست ارسال نشد. لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید. اطلاعات فرم شما حفظ شده است.",
      );
    }
  }

  if (sent) {
    return (
      <div
        className={`${styles.card} ${styles.success}`}
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 size={48} strokeWidth={1.3} aria-hidden="true" />
        <h2 className={styles.title}>گفت‌وگوی ما از همین‌جا شروع شد.</h2>
        <p>
          درخواست مشاوره شما با موفقیت ثبت شد. تیم زر نور نیرو یکتا پس از بررسی اطلاعات، از طریق ایمیل یا
          شماره تماس شما پاسخ می‌دهد.
        </p>
        <Link prefetch={false} href="/">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>درباره پروژه‌تان بگویید</h2>
      <p className={styles.intro}>تکمیل نام، ایمیل، موضوع و شرح نیاز ضروری است.</p>
      <form
        className={styles.form}
        noValidate
        aria-busy={isSubmitting}
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      >
        <Field error={errors.name?.message} htmlFor="contact-name" label="نام و نام خانوادگی">
          <input
            className={styles.input}
            id="contact-name"
            autoComplete="name"
            required
            maxLength={120}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            {...register("name")}
          />
        </Field>
        <div className={styles.row}>
          <Field error={errors.email?.message} htmlFor="contact-email" label="ایمیل">
            <input
              className={styles.input}
              dir="ltr"
              id="contact-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
              {...register("email")}
            />
          </Field>
          <Field error={errors.phone?.message} htmlFor="contact-phone" label="شماره تماس" optional>
            <input
              className={styles.input}
              dir="ltr"
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              placeholder="09123456789"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "contact-phone-error" : undefined}
              {...register("phone", { setValueAs: (value: string) => value.trim() || undefined })}
            />
          </Field>
        </div>
        <Field error={errors.company?.message} htmlFor="contact-company" label="شرکت یا سازمان" optional>
          <input
            className={styles.input}
            id="contact-company"
            autoComplete="organization"
            maxLength={120}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "contact-company-error" : undefined}
            {...register("company")}
          />
        </Field>
        <Field error={errors.topic?.message} htmlFor="contact-topic" label="موضوع مشاوره">
          <select
            className={styles.input}
            id="contact-topic"
            required
            aria-invalid={!!errors.topic}
            aria-describedby={errors.topic ? "contact-topic-error" : undefined}
            {...register("topic")}
          >
            <option value="engineering">مهندسی برق و تأسیسات الکتریکی</option>
            <option value="solar">نیروگاه خورشیدی و انرژی‌های نو</option>
            <option value="audit">ممیزی و مدیریت مصرف انرژی</option>
            <option value="partnership">همکاری در پروژه‌ها</option>
            <option value="wiki">دانشنامه و محتوای تخصصی</option>
            <option value="support">پشتیبانی ابزارهای Xennic</option>
          </select>
        </Field>
        <Field error={errors.message?.message} htmlFor="contact-message" label="شرح نیاز شما">
          <textarea
            className={styles.input}
            id="contact-message"
            placeholder="درباره نوع پروژه، محل اجرا و انتظارات خود بنویسید…"
            required
            maxLength={4000}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            {...register("message")}
          />
        </Field>
        {submitError && (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        )}
        <button className={styles.submit} disabled={isSubmitting} type="submit">
          {isSubmitting ? "در حال ارسال درخواست…" : "ارسال درخواست مشاوره"}
          {isSubmitting ? (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} aria-hidden="true" />
          ) : (
            <ArrowUpLeft size={18} aria-hidden="true" />
          )}
        </button>
        <p className={styles.privacy}>
          <LockKeyhole size={13} aria-hidden="true" /> اطلاعات تماس برای پیگیری همین درخواست دریافت می‌شود.
        </p>
      </form>
    </div>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
  optional,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
  optional?: boolean;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor}>
        {label}
        {optional && <span className={styles.optional}> (اختیاری)</span>}
      </label>
      {children}
      {error && (
        <p className={styles.error} id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
