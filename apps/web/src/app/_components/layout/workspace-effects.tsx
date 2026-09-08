"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const EnergyField = dynamic(() => import("./energy-field").then((module) => module.EnergyField), {
  ssr: false,
});
const workspacePaths = [
  "/audit",
  "/solar",
  "/engineering",
  "/admin",
  "/ai",
  "/login",
  "/register",
  "/forgot",
];

/** Three.js فقط در فضای کاری بارگذاری می‌شود، نه در صفحه‌های عمومی شرکت. */
export function WorkspaceEffects() {
  const pathname = usePathname();
  return workspacePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ? (
    <EnergyField />
  ) : null;
}
