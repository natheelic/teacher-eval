import { GitFork, GitBranch, Database, Archive, Cpu } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { formatDate } from "@/lib/format";
import type { ProjectOverviewData } from "@/lib/queries/workspace";

function StatIconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-16 min-w-16 shrink-0 items-center justify-center rounded-md border border-black/8 bg-white">
      {children}
    </div>
  );
}

type Status = ProjectOverviewData["status"];

const STATUS_LABELS: Record<Status, string> = {
  ACTIVE: "Healthy",
  PAUSED: "Paused",
  RESTARTING: "Restarting",
  PROVISIONING: "Provisioning",
  UNHEALTHY: "Unhealthy",
  DELETING: "Deleting",
};

const STATUS_DOT: Record<Status, string> = {
  ACTIVE: "bg-[#3fcf8e]",
  PAUSED: "bg-[#696969]",
  RESTARTING: "bg-[#dc7b18]",
  PROVISIONING: "bg-[#dc7b18]",
  UNHEALTHY: "bg-[#ab413e]",
  DELETING: "bg-[#ab413e]",
};

function StatusDots({ status }: { status: Status }) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
      ))}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  muted,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  href?: boolean;
}) {
  const content = (
    <>
      <StatIconBox>{icon}</StatIconBox>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-[#464646]">
          {label}
        </p>
        <div className="flex h-[34px] min-h-[34px] w-full items-center py-0.5">
          {typeof value === "string" ? (
            <p
              className={`text-[15px] font-medium ${
                muted ? "text-[#696969]" : "text-[#030303]"
              }`}
            >
              {value}
            </p>
          ) : (
            value
          )}
        </div>
      </div>
    </>
  );

  return href ? (
    <a href="#" className="flex items-center gap-4">
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-4">{content}</div>
  );
}

export function ProjectOverview({ project }: { project: ProjectOverviewData }) {
  return (
    <div className="flex w-full max-w-[744px] flex-col items-start">
      <div className="flex w-full items-center">
        <div className="flex flex-col items-start">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.7px] text-[#030303]">
            {project.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <p className="break-all text-[15px] font-medium text-[#464646]">
              {project.url}
            </p>
            <CopyButton value={project.url} />
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-x-6 gap-y-6 pt-8 sm:grid-cols-2">
        <StatItem
          icon={<StatusDots status={project.status} />}
          label="Status"
          value={STATUS_LABELS[project.status]}
        />
        <StatItem
          icon={<Cpu className="size-[18px] text-[#464646]" />}
          label="Compute"
          value={
            <span className="flex items-center rounded border border-black/15 bg-white/50 px-[5.5px] py-[3px] font-mono text-[11px] font-medium uppercase tracking-[0.66px] text-[#464646]">
              {project.compute.toLowerCase()}
            </span>
          }
        />
        <StatItem
          icon={<GitFork className="size-[18px] text-[#464646]" />}
          label="GitHub"
          value={project.githubRepo ?? "No repository connected"}
          muted={!project.githubRepo}
          href
        />
        <StatItem
          icon={<GitBranch className="size-[18px] text-[#464646]" />}
          label="Recent branch"
          value={project.recentBranch ?? "No branches"}
          muted={!project.recentBranch}
          href
        />
        <StatItem
          icon={<Database className="size-[18px] text-[#464646]" />}
          label="Last migration"
          value={
            project.lastMigration
              ? (project.lastMigration.name ?? formatDate(project.lastMigration.at))
              : "No migrations"
          }
          muted={!project.lastMigration}
          href
        />
        <StatItem
          icon={<Archive className="size-[18px] text-[#464646]" />}
          label="Last backup"
          value={
            project.lastBackupAt ? formatDate(project.lastBackupAt) : "No backups"
          }
          muted={!project.lastBackupAt}
          href
        />
      </div>
    </div>
  );
}
