"use client";

import { useState, useTransition } from "react";
import { ArrowRightLeft } from "lucide-react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";
import { transferProject } from "@/lib/actions/projects";

export type TransferProjectProps = {
  projectId: string;
  /** Organizations the viewer owns, other than the current one. */
  eligibleOrganizations: { id: string; name: string }[];
  canTransfer: boolean;
};

export function TransferProject({
  projectId,
  eligibleOrganizations,
  canTransfer,
}: TransferProjectProps) {
  const [target, setTarget] = useState("");
  const [pending, startTransition] = useTransition();

  const noTargets = eligibleOrganizations.length === 0;

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Transfer project" description="" />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <ArrowRightLeft className="mt-0.5 size-5 shrink-0 text-[#464646]" />
            <div className="flex min-w-0 max-w-[489px] flex-col items-start">
              <p className="text-[13px] font-medium text-[#030303]">
                Transfer project to another organization
              </p>
              <p className="text-[13px] font-medium text-[#464646]">
                To transfer projects, the owner must be a member of both the
                source and target organizations.
              </p>
              {noTargets && canTransfer && (
                <p className="pt-1 text-[13px] font-medium text-[#696969]">
                  You do not own another organization to transfer this to.
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!noTargets && (
              <select
                aria-label="Target organization"
                value={target}
                disabled={pending || !canTransfer}
                onChange={(e) => setTarget(e.target.value)}
                className="h-[26px] rounded-md border border-black/15 bg-[#fdfdfd] px-2 text-xs font-medium text-[#030303] disabled:opacity-50"
              >
                <option value="">Select organization</option>
                {eligibleOrganizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              disabled={pending || !canTransfer || noTargets || !target}
              title={canTransfer ? undefined : "Only owners can transfer."}
              onClick={() =>
                startTransition(async () => {
                  await transferProject(projectId, target);
                  setTarget("");
                })
              }
              className="flex h-[26px] shrink-0 items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Transferring..." : "Transfer project"}
            </button>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
