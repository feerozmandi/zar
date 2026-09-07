"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { contactRequestSchema, type ContactRequestInput } from "@xennic/shared";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { toast } from "sonner";
import { Button, Card, CardContent, Input, Label } from "@xennic/ui";
import { apiFetch } from "@/lib/api-client";

/**
 * فرم درخواست مشاوره — از همان اسکیمای zodِ سمت سرور استفاده می‌کند
 * تا قواعد اعتبارسنجی در وب و API تکرار نشود.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof contactRequestSchema>, unknown, ContactRequestInput>({
    resolver: zodResolver(contactRequestSchema),
  });

  async function onSubmit(values: ContactRequestInput) {
    try {
      await apiFetch("contact", contactRequestSchema, { method: "POST", body: values });
      setSent(true);
      toast.success("درخواست شما ثبت شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا در ثبت درخواست");
    }
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm">
          <CheckCircle2 className="size-5 text-secondary" />
          درخواست شما ثبت شد و کارشناسان ما تماس می‌گیرند.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form className="grid gap-4" noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <Field error={errors.name?.message} htmlFor="name" label="نام و نام خانوادگی">
            <Input id="name" {...register("name")} />
          </Field>
          <Field error={errors.email?.message} htmlFor="email" label="ایمیل">
            <Input dir="ltr" id="email" type="email" {...register("email")} />
          </Field>
          <Field error={errors.phone?.message} htmlFor="phone" label="شماره تماس (اختیاری)">
            <Input dir="ltr" id="phone" placeholder="09xxxxxxxxx" {...register("phone")} />
          </Field>
          <Field error={errors.company?.message} htmlFor="company" label="شرکت / سازمان (اختیاری)">
            <Input id="company" {...register("company")} />
          </Field>
          <Field error={errors.message?.message} htmlFor="message" label="شرح نیاز">
            <textarea
              className="min-h-28 w-full rounded-(--radius-button) border border-input bg-transparent px-3 py-2 text-sm"
              id="message"
              {...register("message")}
            />
          </Field>

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            ثبت درخواست مشاوره
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
