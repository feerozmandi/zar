import type { Metadata, Viewport } from "next";
import { vazirmatn } from "@/lib/fonts";
import { siteUrl } from "@/lib/env";
import { company } from "@/lib/marketing-content";
import { Providers } from "@/providers/providers";
import { AuthBootstrap } from "@/providers/auth-bootstrap";
import { WorkspaceEffects } from "@/app/_components/layout/workspace-effects";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: company.title, template: `%s | ${company.name}` },
  description: company.description,
  applicationName: company.brand,
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  // canonical هر صفحه جداگانه تعریف می‌شود؛ صفحات فرزند نباید همگی به / اشاره کنند.
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFBF8" },
    { media: "(prefers-color-scheme: dark)", color: "#101D17" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable} suppressHydrationWarning>
      <body id="top" className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers>
          <AuthBootstrap />
          <WorkspaceEffects />
          {children}
        </Providers>
      </body>
    </html>
  );
}
