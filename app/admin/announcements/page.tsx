import { Header } from "@/components/dashboard/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AnnouncementSettings } from "@/components/admin/AnnouncementSettings";
import { requireAdmin } from "@/lib/auth/require-session";
import { getActiveAnnouncement } from "@/lib/queries/announcements";

export const metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcement = await getActiveAnnouncement();

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface">
      <Header />
      <div className="flex min-w-0 flex-1">
        <AdminSidebar active="Announcements" />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex flex-col items-center pt-12">
            <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-foreground">
                Announcements
              </h1>
              <p className="text-[15px] font-medium text-foreground-secondary">
                Publish a message shown to every signed-in user until they dismiss it.
              </p>
            </div>

            <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
              <AnnouncementSettings current={announcement} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
