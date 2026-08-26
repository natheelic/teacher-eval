import Link from "next/link";
import { Users, ListChecks, Settings } from "lucide-react";
import { Header } from "@/components/dashboard/Header";
import { IconSidebar } from "@/components/dashboard/IconSidebar";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { getCurrentUser } from "@/lib/auth/require-session";
import { canManageUsers } from "@/lib/permissions";
import { redirect } from "next/navigation";

const MANAGER_LINKS = [
  { label: "Manage users", href: "/users", icon: Users },
  { label: "Audit logs", href: "/account/audit-logs", icon: ListChecks },
  { label: "Account settings", href: "/account/preferences", icon: Settings },
];

const MEMBER_LINKS = [
  { label: "Account preferences", href: "/account/preferences", icon: Settings },
  { label: "Your activity", href: "/account/audit-logs", icon: ListChecks },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const canSeeAll = canManageUsers(user.role);
  const links = canSeeAll ? MANAGER_LINKS : MEMBER_LINKS;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <Header />
      <div className="flex min-w-0 flex-1">
        <IconSidebar />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 pb-24 pt-8 sm:px-10 sm:pt-12">
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Welcome back{user.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                {canSeeAll
                  ? "Here's what's happening across your accounts."
                  : "Here's a quick look at your account."}
              </p>
            </div>

            {canSeeAll && <DashboardStats />}

            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
              <RecentActivity canSeeAll={canSeeAll} />

              <div className="flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2.5 rounded-lg border border-black/8 bg-white px-3 py-2.5 text-[13px] font-medium text-[#030303] hover:border-black/15 hover:bg-black/[0.02]"
                  >
                    <link.icon className="size-4 text-[#464646]" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
