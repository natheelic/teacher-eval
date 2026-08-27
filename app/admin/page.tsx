import { Header } from "@/components/dashboard/Header";
import { IconSidebar } from "@/components/dashboard/IconSidebar";
import { LogoSettings } from "@/components/admin/LogoSettings";
import { requireAdmin } from "@/lib/auth/require-session";
import { getAppSettings } from "@/lib/queries/settings";

export default async function AdminPage() {
  await requireAdmin();
  const { logoUrl } = await getAppSettings();

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <Header />
      <div className="flex min-w-0 flex-1">
        <IconSidebar showAdmin />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="mx-auto flex max-w-[1200px] flex-col px-4 pb-24 pt-8 sm:px-10 sm:pt-12">
            <div className="flex flex-col gap-1 pb-8">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                Admin
              </h1>
              <p className="text-[15px] font-medium text-[#464646]">
                Site-wide settings, visible only to administrators.
              </p>
            </div>

            <LogoSettings currentLogoUrl={logoUrl} />
          </div>
        </main>
      </div>
    </div>
  );
}
