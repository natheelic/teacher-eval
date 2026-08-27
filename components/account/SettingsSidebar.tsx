"use client";

import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { useMobileNav } from "../layout/MobileNavProvider";
import { MobileDrawer } from "../layout/MobileDrawer";

function NavLink({
  label,
  href,
  active,
  onNavigate,
}: {
  label: string;
  href: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  const className = `flex w-full items-center rounded-md px-3 py-[3px] text-[13px] ${
    active
      ? "bg-hover font-semibold text-foreground"
      : "font-medium text-foreground-secondary hover:bg-hover"
  }`;

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} onClick={onNavigate}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onNavigate}>
      {label}
    </a>
  );
}

export function SettingsSidebar({
  active,
}: {
  active: "Preferences" | "Access Tokens" | "Security" | "Audit Logs";
}) {
  const { open, setOpen } = useMobileNav();
  const close = () => setOpen(false);

  return (
    <MobileDrawer open={open} onClose={close} widthClassName="w-[255px]">
      <div className="flex h-full w-full flex-col">
        <div className="flex h-12 items-center justify-between border-b border-border px-6">
          <Link
            href="/dashboard"
            onClick={close}
            className="flex items-center gap-2 text-[13px] font-medium text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <button onClick={close} aria-label="Close navigation" className="flex size-7 items-center justify-center rounded-md hover:bg-hover lg:hidden">
            <X className="size-4 text-foreground-muted" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-col py-4">
            <div className="flex flex-col px-3">
              <p className="px-3 font-mono text-[13px] uppercase text-foreground-muted">
                Account Settings
              </p>
              <div className="flex flex-col gap-px pt-2">
                <NavLink label="Preferences" href="/account/preferences" active={active === "Preferences"} onNavigate={close} />
                <NavLink label="Access Tokens" href="/account/access-tokens" active={active === "Access Tokens"} onNavigate={close} />
                <NavLink label="Security" href="/account/security" active={active === "Security"} onNavigate={close} />
              </div>
            </div>
            <div className="mt-4 h-px w-full bg-hover" />
            <div className="flex flex-col px-3 pt-4">
              <p className="px-3 font-mono text-[13px] uppercase text-foreground-muted">
                Logs
              </p>
              <div className="flex flex-col gap-px pt-2">
                <NavLink label="Audit Logs" href="/account/audit-logs" active={active === "Audit Logs"} onNavigate={close} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileDrawer>
  );
}
