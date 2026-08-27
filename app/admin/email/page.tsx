import { Header } from "@/components/dashboard/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { EmailSettings } from "@/components/admin/EmailSettings";
import { requireAdmin } from "@/lib/auth/require-session";
import { getSmtpSettingsForAdmin } from "@/lib/queries/email-settings";

export const metadata = { title: "Email" };

export default async function AdminEmailPage() {
  const [admin, settings] = await Promise.all([
    requireAdmin(),
    getSmtpSettingsForAdmin(),
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <Header />
      <div className="flex min-w-0 flex-1">
        <AdminSidebar active="Email" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
                Email
              </h1>
              <p className="text-[15px] font-medium text-foreground-secondary">
                Without this, the app cannot invite users or send password resets.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <EmailSettings
                settings={settings}
                defaultTestRecipient={admin.email}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
