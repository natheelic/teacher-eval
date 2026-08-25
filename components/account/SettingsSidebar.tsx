import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

export function SettingsSidebar({
  active,
}: {
  active: "Preferences" | "Access Tokens" | "Security" | "Audit Logs";
}) {
  return (
    <div className="flex w-[255px] shrink-0 flex-col justify-between border-r border-black/8 bg-[#fdfdfd]">
      <div className="flex h-full w-full flex-col">
        <div className="flex h-12 items-center border-b border-black/8 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] font-medium text-[#696969] hover:text-[#030303]"
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-col py-4">
            <div className="flex flex-col px-3">
              <p className="px-3 font-mono text-[13px] uppercase text-[#696969]">
                Account Settings
              </p>
              <div className="flex flex-col gap-px pt-2">
                <NavLink label="Preferences" href="/account/preferences" active={active === "Preferences"} />
                <NavLink label="Access Tokens" href="#" active={active === "Access Tokens"} />
                <NavLink label="Security" href="#" active={active === "Security"} />
              </div>
            </div>
            <div className="mt-4 h-px w-full bg-black/8" />
            <div className="flex flex-col px-3 pt-4">
              <p className="px-3 font-mono text-[13px] uppercase text-[#696969]">
                Logs
              </p>
              <div className="flex flex-col gap-px pt-2">
                <NavLink label="Audit Logs" href="#" active={active === "Audit Logs"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
