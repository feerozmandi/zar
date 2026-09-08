import type { ReactNode } from "react";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  /** برچسب کوچک بالای تیتر (کیکر) */
  kicker: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "start";
  id?: string;
};

/** سرتیتر استاندارد بخش‌های لندینگ — کیکر رنگی + تیتر + توضیح با فضای خالی سخاوتمندانه */
export function SectionHeading({ kicker, title, description, align = "center", id }: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Reveal>
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          {kicker}
        </span>
      </Reveal>
      <Reveal delay={90}>
        <h2 id={id} className="mt-5 text-2xl leading-[1.4] font-black sm:text-3xl lg:text-4xl">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={160}>
          <p className="mt-5 text-base leading-8 text-muted-foreground">{description}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
