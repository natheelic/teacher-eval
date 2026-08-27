import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { IconSidebar } from "@/components/dashboard/IconSidebar";
import { UsersTable } from "@/components/users/UsersTable";
import { getCurrentUser } from "@/lib/auth/require-session";
import { canManageUsers } from "@/lib/permissions";

export default async function UsersPage({
  searchParams,
}: PageProps<"/users">) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  // Members and viewers have no business here; send them to their own account
  // rather than showing an empty or forbidden table.
  if (!canManageUsers(user.role)) redirect("/account/preferences");

  // Next 16: searchParams is a Promise.
  const params = await searchParams;

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <Header />
      <div className="flex min-w-0 flex-1">
        <IconSidebar showAdmin={user.role === "ADMIN"} />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="mx-auto flex max-w-[1200px] flex-col px-4 pb-24 pt-8 sm:px-10 sm:pt-12">
            <div className="flex flex-col gap-1 pb-8">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
                Users
              </h1>
              <p className="text-[15px] font-medium text-foreground-secondary">
                Manage accounts, roles, and access.
              </p>
            </div>

            <UsersTable searchParams={params} />
          </div>
        </main>
      </div>
    </div>
  );
}
