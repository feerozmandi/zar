"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

const WorkspaceProviders = dynamic(() => import("./workspace-providers"));

/** پوسته عمومی سبک؛ React Query و اعلان‌های پنل جداگانه بارگذاری می‌شوند. */
export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMarketing = ["/", "/about", "/contact"].includes(pathname);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {isMarketing ? children : <WorkspaceProviders>{children}</WorkspaceProviders>}
    </ThemeProvider>
  );
}
