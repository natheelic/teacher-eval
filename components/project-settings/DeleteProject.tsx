import { AlertTriangle } from "lucide-react";
import { SectionHeading } from "../account/SettingsPrimitives";
import { DeleteProjectButton } from "./DeleteProjectButton";

export type DeleteProjectProps = {
  projectId: string;
  projectName: string;
  canDelete: boolean;
};

export function DeleteProject({
  projectId,
  projectName,
  canDelete,
}: DeleteProjectProps) {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Delete project"
        description="Permanently remove your project and its database"
      />
      <div className="relative flex w-full max-w-[688px] flex-col items-start gap-3 rounded-lg border border-[#fdd8d3] bg-[#fffcfc] p-4 pl-10">
        <AlertTriangle className="absolute left-4 top-4 size-[18px] text-[#ab413e]" />
        <p className="text-[13px] font-semibold text-[#030303]">
          Deleting this project will also remove your database.
        </p>
        <p className="-mt-2 text-[13px] font-medium text-[#464646]">
          Make sure you have made a backup if you want to keep your data. This
          cannot be undone from the dashboard.
        </p>
        <DeleteProjectButton
          projectId={projectId}
          projectName={projectName}
          canDelete={canDelete}
        />
      </div>
    </div>
  );
}
