import { Header } from "@/components/dashboard/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AppNameSettings } from "@/components/admin/AppNameSettings";
import { LogoSettings } from "@/components/admin/LogoSettings";
import { requireAdmin } from "@/lib/auth/require-session";
import { getAppSettings } from "@/lib/queries/settings";

export const metadata = { title: "Branding" };

export default async function AdminBrandingPage() {
  await requireAdmin();
  const { logoUrl, appName } = await getAppSettings();

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <Header />
      <div className="flex min-w-0 flex-1">
        <AdminSidebar active="Branding" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
                Branding
              </h1>
              <p className="text-[15px] font-medium text-foreground-secondary">
                The name and logo shown across the app.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <AppNameSettings currentName={appName} />
              <LogoSettings currentLogoUrl={logoUrl} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
