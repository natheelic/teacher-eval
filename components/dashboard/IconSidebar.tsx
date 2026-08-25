import Link from "next/link";
import {
  Home,
  Users,
  Lightbulb,
  Rocket,
  ListChecks,
  Settings,
  PanelLeft,
} from "lucide-react";

function NavItem({
  icon: Icon,
  active,
  label,
  showLabel,
  dot,
  href = "#",
}: {
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  label?: string;
  showLabel?: boolean;
  dot?: boolean;
  href?: string;
}) {
  const className = `relative flex size-8 items-center justify-center gap-2 overflow-visible rounded-md pl-1.5 pr-2 py-2 hover:bg-black/4 ${
    active ? "bg-black/4" : ""
  } ${showLabel ? "w-auto pr-3" : ""}`;

  const content = (
    <>
      <Icon className="size-5 text-[#030303]" />
      {showLabel && (
        <span className="text-[13px] font-medium text-[#696969] whitespace-nowrap">
          {label}
        </span>
      )}
      {dot && (
        <span className="absolute left-[18px] top-[8px] size-2 rounded-full bg-[#dc7b18]" />
      )}
    </>
  );

  return (
    <div className="flex w-full flex-col items-start">
      {href.startsWith("/") ? (
        <Link href={href} title={label} className={className}>
          {content}
        </Link>
      ) : (
        <a href={href} title={label} className={className}>
          {content}
        </a>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="h-px w-[31px] bg-black/8" />
    </div>
  );
}

export function IconSidebar() {
  return (
    <div className="flex items-start border-r border-black/8">
      <div className="flex h-full w-[47px] flex-col bg-[#fdfdfd]">
        <div className="flex flex-1 flex-col overflow-hidden">
          <nav className="flex w-full flex-col">
            <div className="flex flex-col gap-1 p-2">
              <NavItem icon={Home} active />
              <NavItem icon={Users} label="Users" />
            </div>
            <Divider />
            <div className="flex flex-col gap-1 p-2">
              <NavItem icon={Lightbulb} label="Advisors" dot />
              <NavItem icon={Rocket} label="Reports" />
              <NavItem icon={ListChecks} label="Logs" />
            </div>
            <Divider />
            <div className="flex flex-col p-2">
              <NavItem icon={Settings} label="Project settings" href="/project/settings" />
            </div>
          </nav>
        </div>
        <div className="flex flex-col p-2">
          <button className="flex h-[26px] w-7 items-center justify-center rounded-md px-1.5 py-1 hover:bg-black/4">
            <PanelLeft className="size-3.5 text-[#464646]" />
          </button>
        </div>
      </div>
    </div>
  );
}
