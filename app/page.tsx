import { Header } from "@/components/dashboard/Header";
import { IconSidebar } from "@/components/dashboard/IconSidebar";
import { ProjectOverview } from "@/components/dashboard/ProjectOverview";
import { RegionMapCard } from "@/components/dashboard/RegionMapCard";
import { UsageCharts } from "@/components/dashboard/UsageCharts";
import { AdvisorPanel } from "@/components/dashboard/AdvisorPanel";
import { ReportsPanel } from "@/components/dashboard/ReportsPanel";
import { NoticeBanner } from "@/components/dashboard/NoticeBanner";
import { getDefaultProject } from "@/lib/queries/workspace";

export default async function Home() {
  const project = await getDefaultProject();

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <Header />
      <div className="flex min-w-0 flex-1">
        <IconSidebar />
        <main className="flex-1 min-w-0 overflow-x-auto">
          <div className="mx-auto max-w-[1600px] px-4 pt-8 pb-8 sm:px-[72px] sm:pt-12 sm:pb-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="self-center">
                {project ? (
                  <ProjectOverview project={project} />
                ) : (
                  <p className="text-[15px] font-medium text-[#696969]">
                    This organization has no projects yet.
                  </p>
                )}
              </div>
              <div className="self-center">
                <RegionMapCard />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] px-4 pb-16 sm:px-[72px] sm:pb-24">
            <div className="flex flex-col gap-10 sm:gap-[56px]">
              <UsageCharts />
              <AdvisorPanel />
              <ReportsPanel />
            </div>
          </div>
        </main>
      </div>
      <NoticeBanner />
    </div>
  );
}
