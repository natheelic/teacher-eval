"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ListChecks, Settings, ShieldCheck, X } from "lucide-react";
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
  const className = `relative flex h-9 w-full items-center gap-2.5 overflow-visible rounded-md px-2.5 hover:bg-hover lg:size-8 lg:w-8 lg:justify-center lg:px-0 lg:py-2 ${
    active ? "bg-hover" : ""
  }`;

  const content = (
    <>
      <Icon className="size-5 shrink-0 text-foreground" />
      {label && (
        <span className="text-[13px] font-medium text-foreground-muted whitespace-nowrap lg:hidden">
          {label}
        </span>
      )}
      {dot && (
        <span className="absolute left-[30px] top-2 size-2 rounded-full bg-pending-strong lg:left-[18px]" />
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
      <div className="h-px w-full bg-hover lg:w-[31px]" />
    </div>
  );
}

export function IconSidebar({ showAdmin = false }: { showAdmin?: boolean }) {
  const { open, setOpen } = useMobileNav();
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <MobileDrawer open={open} onClose={close} widthClassName="w-[240px] lg:w-[47px]">
      <div className="flex h-12 items-center justify-between px-3 lg:hidden">
        <p className="text-[13px] font-semibold text-foreground">Menu</p>
        <button onClick={close} aria-label="Close navigation" className="flex size-7 items-center justify-center rounded-md hover:bg-hover">
          <X className="size-4 text-foreground-secondary" />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <nav className="flex w-full flex-col">
          <div className="flex flex-col gap-1 p-2">
            <NavItem
              icon={LayoutDashboard}
              label="Dashboard"
              href="/dashboard"
              active={pathname === "/dashboard"}
              onNavigate={close}
            />
            <NavItem
              icon={Users}
              label="Users"
              href="/users"
              active={pathname.startsWith("/users")}
              onNavigate={close}
            />
            <NavItem
              icon={ListChecks}
              label="Audit logs"
              href="/account/audit-logs"
              active={pathname === "/account/audit-logs"}
              onNavigate={close}
            />
            {showAdmin && (
              <NavItem
                icon={ShieldCheck}
                label="Admin"
                href="/admin"
                active={pathname.startsWith("/admin")}
                onNavigate={close}
              />
            )}
          </div>
          <Divider />
          <div className="flex flex-col p-2">
            <NavItem icon={Settings} label="Account settings" href="/account/preferences" onNavigate={close} />
          </div>
        </nav>
      </div>
    </MobileDrawer>
  );
}
