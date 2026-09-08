import Image from "next/image";
import type { CSSProperties } from "react";

interface MarketingImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  preload?: boolean;
}

/**
 * تصویر responsive از پیش بهینه‌شده: هزینه تولید AVIF در اولین بازدید
 * به مرورگر/سرور تحمیل نمی‌شود. Next Image قاب ثابت و alt را حفظ می‌کند؛
 * picture نسخه مناسب را انتخاب می‌کند. بازتولید: scripts/optimize-landing-images.mjs
 */
export function MarketingImage({ src, alt, sizes, className, style, preload = false }: MarketingImageProps) {
  const stem = src.replace(/\.webp$/, "");
  const avif = [480, 800, 1264].map((width) => `${stem}-${width}.avif ${width}w`).join(", ");
  const webp = `${stem}-480.webp 480w, ${stem}-800.webp 800w, ${src} 1264w`;

  return (
    <>
      {preload && (
        <link
          rel="preload"
          as="image"
          type="image/avif"
          imageSrcSet={avif}
          imageSizes={sizes}
          fetchPriority="high"
        />
      )}
      <picture>
        <source type="image/avif" srcSet={avif} sizes={sizes} />
        <source type="image/webp" srcSet={webp} sizes={sizes} />
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          loading={preload ? "eager" : "lazy"}
          fetchPriority={preload ? "high" : "auto"}
          className={className}
          style={style}
        />
      </picture>
    </>
  );
}
