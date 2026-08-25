"use client";

import Link from "next/link";
import {
  Home,
  Users,
  Lightbulb,
  Rocket,
  ListChecks,
  Settings,
  PanelLeft,
  X,
} from "lucide-react";
import { useMobileNav } from "../layout/MobileNavProvider";
import { MobileDrawer } from "../layout/MobileDrawer";

function NavItem({
  icon: Icon,
  active,
  label,
  dot,
  href = "#",
  onNavigate,
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  label?: string;
  dot?: boolean;
  href?: string;
  onNavigate?: () => void;
}) {
  const className = `relative flex h-9 w-full items-center gap-2.5 overflow-visible rounded-md px-2.5 hover:bg-black/4 lg:size-8 lg:w-8 lg:justify-center lg:px-0 lg:py-2 ${
    active ? "bg-black/4" : ""
  }`;

  const content = (
    <>
      <Icon className="size-5 shrink-0 text-[#030303]" />
      {label && (
        <span className="text-[13px] font-medium text-[#696969] whitespace-nowrap lg:hidden">
          {label}
        </span>
      )}
      {dot && (
        <span className="absolute left-[30px] top-2 size-2 rounded-full bg-[#dc7b18] lg:left-[18px]" />
      )}
    </>
  );

  return (
    <div className="flex w-full flex-col items-start">
      {href.startsWith("/") ? (
        <Link href={href} title={label} className={className} onClick={onNavigate}>
          {content}
        </Link>
      ) : (
        <a href={href} title={label} className={className} onClick={onNavigate}>
          {content}
        </a>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="h-px w-full bg-black/8 lg:w-[31px]" />
    </div>
  );
}

export function IconSidebar() {
  const { open, setOpen } = useMobileNav();
  const close = () => setOpen(false);

  return (
    <MobileDrawer open={open} onClose={close} widthClassName="w-[240px] lg:w-[47px]">
      <div className="flex h-12 items-center justify-between px-3 lg:hidden">
        <p className="text-[13px] font-semibold text-[#030303]">Menu</p>
        <button onClick={close} aria-label="Close navigation" className="flex size-7 items-center justify-center rounded-md hover:bg-black/4">
          <X className="size-4 text-[#464646]" />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <nav className="flex w-full flex-col">
          <div className="flex flex-col gap-1 p-2">
            <NavItem icon={Home} label="Home" active onNavigate={close} />
            <NavItem icon={Users} label="Users" onNavigate={close} />
          </div>
          <Divider />
          <div className="flex flex-col gap-1 p-2">
            <NavItem icon={Lightbulb} label="Advisors" dot onNavigate={close} />
            <NavItem icon={Rocket} label="Reports" onNavigate={close} />
            <NavItem icon={ListChecks} label="Logs" onNavigate={close} />
          </div>
          <Divider />
          <div className="flex flex-col p-2">
            <NavItem icon={Settings} label="Project settings" href="/project/settings" onNavigate={close} />
          </div>
        </nav>
      </div>
      <div className="flex flex-col p-2">
        <button className="hidden h-[26px] w-7 items-center justify-center rounded-md px-1.5 py-1 hover:bg-black/4 lg:flex">
          <PanelLeft className="size-3.5 text-[#464646]" />
        </button>
      </div>
    </MobileDrawer>
  );
}
