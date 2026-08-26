import { Header } from "@/components/dashboard/Header";
import { IconSidebar } from "@/components/dashboard/IconSidebar";
import { NoticeBanner } from "@/components/dashboard/NoticeBanner";
import { ProjectSettingsSidebar } from "@/components/project-settings/ProjectSettingsSidebar";
import { GeneralSettingsForm } from "@/components/project-settings/GeneralSettingsForm";
import { ProjectAccess } from "@/components/project-settings/ProjectAccess";
import { ProjectAvailability } from "@/components/project-settings/ProjectAvailability";
import { ServiceVersions } from "@/components/project-settings/ServiceVersions";
import { CustomDomains } from "@/components/project-settings/CustomDomains";
import { TransferProject } from "@/components/project-settings/TransferProject";
import { DeleteProject } from "@/components/project-settings/DeleteProject";
import { getProjectSettings, LATEST_DB_VERSION } from "@/lib/queries/project";

export default async function ProjectSettingsPage() {
  const project = await getProjectSettings();

  // Role gates: admins configure, owners transfer and delete.
  const canEdit = project.viewerRole === "OWNER" || project.viewerRole === "ADMIN";
  const isOwner = project.viewerRole === "OWNER";

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <Header />
      <div className="flex min-w-0 flex-1">
        <IconSidebar />
        <div className="flex min-w-0 flex-1 flex-col border-l border-black/8 lg:flex-row">
          <ProjectSettingsSidebar active="General" />
          <div className="hidden w-px shrink-0 bg-black/8 lg:block" />
          <main className="flex-1 min-w-0 overflow-x-auto">
            <div className="flex flex-col items-center pt-8 sm:pt-12">
              <div className="flex w-full max-w-[768px] flex-col gap-1 px-4 sm:px-10">
                <h1 className="font-display text-[22px] font-semibold tracking-[-0.55px] text-[#030303]">
                  Project Settings
                </h1>
                <p className="text-[15px] font-medium text-[#464646]">
                  General configuration, domains, ownership, and lifecycle
                </p>
              </div>

              <div className="flex w-full max-w-[768px] flex-col gap-16 px-4 pb-24 pt-12 sm:px-10">
                <GeneralSettingsForm project={project} canEdit={canEdit} />
                <ProjectAccess
                  orgMemberCount={project.orgMemberCount}
                  members={project.members}
                />
                <ProjectAvailability
                  projectId={project.id}
                  status={project.status}
                  canManage={canEdit}
                />
                <ServiceVersions
                  projectId={project.id}
                  versions={{
                    authVersion: project.authVersion,
                    apiVersion: project.apiVersion,
                    dbVersion: project.dbVersion,
                  }}
                  latestDbVersion={LATEST_DB_VERSION}
                  canUpgrade={canEdit}
                />
                <CustomDomains plan={project.plan} domains={project.domains} />
                <TransferProject
                  projectId={project.id}
                  eligibleOrganizations={project.transferTargets}
                  canTransfer={isOwner}
                />
                <DeleteProject
                  projectId={project.id}
                  projectName={project.name}
                  canDelete={isOwner}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
      <NoticeBanner />
    </div>
  );
}
