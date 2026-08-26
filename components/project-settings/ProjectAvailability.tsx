"use client";

import { useTransition } from "react";
import { Pause, Play } from "lucide-react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";
import {
  pauseProject,
  restartProject,
  resumeProject,
} from "@/lib/actions/projects";

export type ProjectAvailabilityProps = {
  projectId: string;
  status: "ACTIVE" | "PAUSED" | "RESTARTING" | "PROVISIONING" | "UNHEALTHY" | "DELETING";
  canManage: boolean;
};

export function ProjectAvailability({
  projectId,
  status,
  canManage,
}: ProjectAvailabilityProps) {
  const [pending, startTransition] = useTransition();
  const paused = status === "PAUSED";

  const buttonClass =
    "flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Project availability"
        description="Restart or pause your project when performing maintenance"
      />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col items-start">
            <p className="text-[13px] font-medium text-[#030303]">
              Restart project
            </p>
            <p className="text-[13px] font-medium text-[#464646]">
              Your project will not be available for a few minutes.
            </p>
          </div>
          <button
            type="button"
            // Restarting a paused project would be a no-op; resume it first.
            disabled={pending || !canManage || paused}
            onClick={() =>
              startTransition(async () => {
                await restartProject(projectId);
              })
            }
            className={buttonClass}
          >
            {pending ? "Working..." : "Restart project"}
          </button>
        </div>

        <div className="flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col items-start">
            <p className="text-[13px] font-medium text-[#030303]">
              {paused ? "Resume project" : "Pause project"}
            </p>
            <p className="text-[13px] font-medium text-[#464646]">
              {paused
                ? "Bring the project back online."
                : "Your project will not be accessible while it is paused."}
            </p>
          </div>
          <button
            type="button"
            disabled={pending || !canManage}
            onClick={() =>
              startTransition(async () => {
                if (paused) await resumeProject(projectId);
                else await pauseProject(projectId);
              })
            }
            className={buttonClass}
          >
            {paused ? (
              <Play className="size-3.5" />
            ) : (
              <Pause className="size-3.5" />
            )}
            {pending
              ? "Working..."
              : paused
                ? "Resume project"
                : "Pause project"}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
