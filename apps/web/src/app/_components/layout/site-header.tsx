"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ArrowUpLeft, ChevronDown, LayoutDashboard, LogIn, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { company, marketingNavigation } from "@/lib/marketing-content";
import { defaultRedirectForRole, useAuthStore } from "@/store/auth-store";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";
import styles from "./site-chrome.module.css";

// نشست ذخیره‌شده فقط بعد از hydration نمایش داده می‌شود تا SSR با مرورگر یکسان باشد.
const subscribe = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function AccountMenu() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);

  if (!mounted || !user || status !== "authenticated") {
    return (
      <Link className={styles.accountLink} href="/login" prefetch={false} aria-label="ورود به حساب Xennic">
        <LogIn size={16} aria-hidden="true" />
        <span className={styles.accountLabel}>ورود به حساب</span>
        <span className="sr-only"> Xennic</span>
      </Link>
    );
  }

  return (
    <DropdownMenu.Root dir="rtl">
      <DropdownMenu.Trigger asChild>
        <button type="button" className={styles.accountButton} aria-label="منوی حساب کاربری">
          <UserRound size={17} aria-hidden="true" />
          <span className={styles.accountLabel}>حساب کاربری</span>
          <ChevronDown size={12} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className={`site-chrome ${styles.dropdown}`} align="end" sideOffset={12}>
          <DropdownMenu.Label className={styles.dropdownLabel} dir="ltr">
            {user.email}
          </DropdownMenu.Label>
          <DropdownMenu.Item asChild className={styles.dropdownItem}>
            <Link href={defaultRedirectForRole(user.role)} prefetch={false}>
              <LayoutDashboard size={16} aria-hidden="true" />
              ورود به پنل من
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className={styles.dropdownSeparator} />
          <DropdownMenu.Item
            className={styles.dropdownItem}
            onSelect={() => void useAuthStore.getState().signOut()}
          >
            <LogOut size={16} aria-hidden="true" />
            خروج از حساب
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MobileNavigation() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const authenticated = mounted && user && status === "authenticated";

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileTrigger}`}
          aria-label="باز کردن منوی اصلی"
        >
          <Menu size={23} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={`site-chrome ${styles.mobileOverlay}`} />
        <Dialog.Content className={`site-chrome ${styles.mobileDrawer}`} dir="rtl">
          <div className={styles.drawerHeading}>
            <Dialog.Title>
              <span className="sr-only">منوی اصلی </span>
              <BrandLogo />
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className={styles.iconButton} aria-label="بستن منوی اصلی">
                <X size={22} aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className={styles.drawerDescription}>
            مشاوره، طراحی و اجرای برق و انرژی‌های نو
          </Dialog.Description>
          <nav className={styles.mobileNav} aria-label="ناوبری موبایل">
            {marketingNavigation.map((item, index) => (
              <Dialog.Close asChild key={item.href}>
                <Link prefetch={false} href={item.href}>
                  {item.label}
                  <span aria-hidden="true">
                    {(index + 1).toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}
                  </span>
                </Link>
              </Dialog.Close>
            ))}
          </nav>
          <div className={styles.drawerActions}>
            <Dialog.Close asChild>
              <Link prefetch={false} href="/contact" className={styles.consultLink}>
                درخواست مشاوره <ArrowUpLeft size={18} aria-hidden="true" />
              </Link>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Link
                href={authenticated ? defaultRedirectForRole(user.role) : "/login"}
                prefetch={false}
                className={styles.accountLink}
              >
                <UserRound size={17} aria-hidden="true" />
                {authenticated ? "ورود به پنل من" : "ورود به حساب Xennic"}
              </Link>
            </Dialog.Close>
            {authenticated && (
              <Dialog.Close asChild>
                <button
                  type="button"
                  className={styles.accountLink}
                  onClick={() => void useAuthStore.getState().signOut()}
                >
                  <LogOut size={17} aria-hidden="true" />
                  خروج از حساب
                </button>
              </Dialog.Close>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** ناوبری عمومی با منوی موبایل focus-trapped و دسترسی واقعی به حساب کاربری. */
export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={`site-chrome ${styles.header}`}>
      <div className={styles.headerInner}>
        <Link
          prefetch={false}
          className={styles.brandLink}
          href="/"
          aria-label={`xennic. ${company.name} — صفحه اصلی`}
        >
          <BrandLogo />
        </Link>
        <nav aria-label="ناوبری اصلی" className={styles.desktopNav}>
          {marketingNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.navLink}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <div className={styles.headerAccount}>
            <AccountMenu />
          </div>
          <Link prefetch={false} href="/contact" className={styles.consultLink}>
            درخواست مشاوره
            <ArrowUpLeft size={16} aria-hidden="true" />
          </Link>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
