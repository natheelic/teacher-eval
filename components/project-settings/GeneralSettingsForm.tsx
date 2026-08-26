"use client";

import { useActionState } from "react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";
import { CopyButton } from "../dashboard/CopyButton";
import { updateProject } from "@/lib/actions/projects";
import type { ActionState } from "@/lib/actions/profile";

export type GeneralSettingsFormProps = {
  project: {
    id: string;
    name: string;
    ref: string;
    region: string;
    regionLabel: string;
  };
  canEdit: boolean;
};

const initialState: ActionState = {};

function ReadOnlyField({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
      <div className="flex flex-1 flex-col items-start">
        <span className="text-[13px] font-medium text-[#030303]">{label}</span>
        <p className="text-[13px] font-medium text-[#696969]">{description}</p>
      </div>
      <div className="flex h-[34px] w-full shrink-0 items-center justify-between rounded-md border border-black/8 bg-black/[0.01] pl-3 pr-1 sm:w-[327px]">
        <span className="truncate text-[13px] font-medium text-[#464646]">
          {value}
        </span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function GeneralSettingsForm({
  project,
  canEdit,
}: GeneralSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProject,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col items-start gap-6">
      <input type="hidden" name="projectId" value={project.id} />
      <SectionHeading title="General settings" description="" />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label
              htmlFor="project-name"
              className="text-[13px] font-medium text-[#030303]"
            >
              Project name
            </label>
            <p className="text-[13px] font-medium text-[#696969]">
              Displayed throughout the dashboard.
            </p>
            {state.fieldErrors?.name && (
              <p className="text-xs font-medium text-[#ab413e]">
                {state.fieldErrors.name}
              </p>
            )}
          </div>
          <input
            id="project-name"
            name="name"
            defaultValue={project.name}
            disabled={!canEdit}
            placeholder="my-project"
            className="h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[327px]"
          />
        </div>

        <ReadOnlyField
          label="Project ID"
          description="Reference used in APIs and URLs."
          value={project.ref}
        />
        <ReadOnlyField
          label="Project region"
          description={project.regionLabel}
          value={project.region}
        />

        <div className="flex w-full items-center justify-end gap-3 p-4">
          {state.ok && (
            <span className="text-xs font-medium text-[#16b674]">Saved</span>
          )}
          <button
            type="submit"
            disabled={pending || !canEdit}
            title={canEdit ? undefined : "Only owners and admins can edit this."}
            className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-[#62d79f] disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </SettingsCard>
    </form>
  );
}
