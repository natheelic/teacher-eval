"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, X } from "lucide-react";
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
      ? "bg-black/4 font-semibold text-[#030303]"
      : "font-medium text-[#464646] hover:bg-black/4"
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

function ExternalLink({ label, badge }: { label: string; badge?: string }) {
  return (
    <a
      href="#"
      className="flex w-full items-center justify-between rounded-md px-3 py-[3px] text-[13px] font-medium text-[#464646] hover:bg-black/4"
    >
      <span className="flex items-center gap-1">
        {label}
        {badge && (
          <span className="flex items-center rounded-full border border-[#f3ba63] bg-[#ca8a10]/10 px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#dc7b18]">
            {badge}
          </span>
        )}
      </span>
      <ArrowUpRight className="size-4 text-[#696969]" />
    </a>
  );
}

export function ProjectSettingsSidebar({
  active,
}: {
  active:
    | "General"
    | "Infrastructure"
    | "Integrations"
    | "API Keys"
    | "JWT Keys"
    | "Log Drains"
    | "Add-ons";
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#030303] lg:hidden"
      >
        <span>
          Settings: <span className="text-[#464646]">{active}</span>
        </span>
        <ChevronDown className="size-4 text-[#696969]" />
      </button>
      <MobileDrawer open={open} onClose={close} widthClassName="w-[256px]">
        <div className="flex min-h-12 items-center justify-between border-b border-black/8 px-6">
          <p className="font-display text-base font-semibold text-[#030303]">
            Settings
          </p>
          <button onClick={close} aria-label="Close navigation" className="flex size-7 items-center justify-center rounded-md hover:bg-black/4 lg:hidden">
            <X className="size-4 text-[#696969]" />
          </button>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden py-4">
          <div className="flex flex-col px-3">
            <p className="px-3 font-mono text-[13px] uppercase text-[#696969]">
              Configuration
            </p>
            <div className="flex flex-col gap-px pt-2">
              <NavLink label="General" href="/project/settings" active={active === "General"} onNavigate={close} />
              <NavLink label="Infrastructure" href="#" active={active === "Infrastructure"} onNavigate={close} />
              <NavLink label="Integrations" href="#" active={active === "Integrations"} onNavigate={close} />
              <NavLink label="API Keys" href="#" active={active === "API Keys"} onNavigate={close} />
              <NavLink label="JWT Keys" href="#" active={active === "JWT Keys"} onNavigate={close} />
              <NavLink label="Log Drains" href="#" active={active === "Log Drains"} onNavigate={close} />
              <NavLink label="Add-ons" href="#" active={active === "Add-ons"} onNavigate={close} />
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-black/8" />
          <div className="flex flex-col px-3 pt-4">
            <p className="px-3 font-mono text-[13px] uppercase text-[#696969]">
              Integrations
            </p>
            <div className="flex flex-col gap-px pt-2">
              <ExternalLink label="Data API" />
              <ExternalLink label="Vault" badge="Beta" />
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-black/8" />
          <div className="flex flex-col px-3 pt-4">
            <p className="px-3 font-mono text-[13px] uppercase text-[#696969]">
              Billing
            </p>
            <div className="flex flex-col gap-px pt-2">
              <ExternalLink label="Subscription" />
              <ExternalLink label="Usage" />
            </div>
          </div>
        </div>
      </MobileDrawer>
    </>
  );
}
