import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

function NavLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  const className = `flex w-full items-center rounded-md px-3 py-[3px] text-[13px] ${
    active
      ? "bg-black/4 font-semibold text-[#030303]"
      : "font-medium text-[#464646] hover:bg-black/4"
  }`;

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
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
  return (
    <div className="flex w-[256px] shrink-0 flex-col bg-[#fdfdfd]">
      <div className="flex min-h-12 items-center border-b border-black/8 px-6">
        <p className="font-display text-base font-semibold text-[#030303]">
          Settings
        </p>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden py-4">
        <div className="flex flex-col px-3">
          <p className="px-3 font-mono text-[13px] uppercase text-[#696969]">
            Configuration
          </p>
          <div className="flex flex-col gap-px pt-2">
            <NavLink label="General" href="/project/settings" active={active === "General"} />
            <NavLink label="Infrastructure" href="#" active={active === "Infrastructure"} />
            <NavLink label="Integrations" href="#" active={active === "Integrations"} />
            <NavLink label="API Keys" href="#" active={active === "API Keys"} />
            <NavLink label="JWT Keys" href="#" active={active === "JWT Keys"} />
            <NavLink label="Log Drains" href="#" active={active === "Log Drains"} />
            <NavLink label="Add-ons" href="#" active={active === "Add-ons"} />
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
    </div>
  );
}
