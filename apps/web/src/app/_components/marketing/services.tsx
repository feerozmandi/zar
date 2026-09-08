import { Activity, ArrowUpLeft, Building2, Sun, UtilityPole } from "lucide-react";
import { MarketingImage } from "./marketing-image";
import Link from "next/link";
import { services } from "@/lib/marketing-content";
import styles from "./marketing.module.css";

export function ExpertiseStrip() {
  const areas = [
    { title: "انرژی‌های تجدیدپذیر", icon: Sun },
    { title: "شبکه‌های برق و توزیع", icon: UtilityPole },
    { title: "صنعت و ساختمان", icon: Building2 },
    { title: "بهره‌وری و مدیریت انرژی", icon: Activity },
  ];

  return (
    <div className={styles.expertiseStrip}>
      <ul className={`${styles.container} ${styles.expertiseList}`} aria-label="حوزه‌های فعالیت">
        {areas.map(({ title, icon: Icon }) => (
          <li key={title}>
            <Icon size={23} strokeWidth={1.4} aria-hidden="true" />
            <span>{title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Services() {
  return (
    <section
      id="services"
      className={`${styles.container} ${styles.section}`}
      aria-labelledby="services-title"
    >
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            تخصص ما، اطمینان شما
          </p>
          <h2 className={styles.sectionTitle} id="services-title">
            راهکارهای یکپارچه برای
            <br />
            دنیایی روشن‌تر.
          </h2>
        </div>
        <p className={styles.sectionIntro}>
          هر پروژه، نیاز و مسیر خودش را دارد. ما دانش مهندسی و تجربه اجرا را کنار هم می‌آوریم تا راهکار مناسب
          شما شکل بگیرد.
        </p>
      </div>
      <div className={styles.serviceGrid}>
        {services.map((service) => (
          <article className={styles.serviceCard} key={service.id}>
            <div className={styles.serviceImage}>
              <MarketingImage
                src={service.image}
                alt={service.imageAlt}
                sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1023px) 45vw, 390px"
                className={styles.coverImage}
                style={{ objectPosition: service.imagePosition }}
              />
              <span className={styles.serviceNumber} aria-hidden="true">
                {service.number}
              </span>
            </div>
            <div className={styles.serviceBody}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul className={styles.serviceTags} aria-label="خدمات این حوزه">
                {service.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <Link prefetch={false} className={styles.serviceLink} href={service.href}>
                {service.cta}
                <span>
                  <ArrowUpLeft size={19} aria-hidden="true" />
                </span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
