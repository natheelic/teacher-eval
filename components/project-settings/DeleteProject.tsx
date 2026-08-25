import { AlertTriangle } from "lucide-react";
import { SectionHeading } from "../account/SettingsPrimitives";

export function DeleteProject() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Delete project"
        description="Permanently remove your project and its database"
      />
      <div className="relative flex w-full max-w-[688px] flex-col items-start gap-3 rounded-lg border border-[#fdd8d3] bg-[#fffcfc] p-4 pl-10">
        <AlertTriangle className="absolute left-4 top-4 size-[18px] text-[#ab413e]" />
        <p className="text-[13px] font-semibold text-[#030303]">
          Deleting this project will also remove your database and uninstall
          the resource on Vercel.
        </p>
        <p className="-mt-2 text-[13px] font-medium text-[#464646]">
          Make sure you have made a backup if you want to keep your data, and
          that no Vercel project is connected to this resource.
        </p>
        <button className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/30 bg-[#fff0ee] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95">
          Delete project
        </button>
      </div>
    </div>
  );
}
