"use client";

import Link from "next/link";

/**
 * The nav row shared by the two text sidebars — SettingsSidebar (/account/*)
 * and AdminSidebar (/admin/*). Extracted when the second one appeared rather
 * than copied, so the active/inactive styling stays in one place.
 *
 * IconSidebar keeps its own NavItem: it is an icon rail with a mobile-only
 * label and a different layout, not the same control.
 */
export function SidebarNavLink({
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
