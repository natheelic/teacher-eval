import { AlertTriangle } from "lucide-react";
import { SectionHeading } from "./SettingsPrimitives";

export function DangerZone() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Danger zone"
        description="Permanently delete your Supabase account and data."
      />
      <div className="relative flex w-[688px] flex-col items-start gap-3 rounded-lg border border-[#fdd8d3] bg-[#fffcfc] p-4 pl-10">
        <AlertTriangle className="absolute left-4 top-4 size-[18px] text-[#ab413e]" />
        <p className="text-[13px] font-semibold text-[#030303]">
          Request for account deletion
        </p>
        <p className="-mt-2 text-[13px] font-medium text-[#464646]">
          Deleting your account is permanent and cannot be undone. Your data
          will be deleted within 30 days, but we may retain some metadata
          and logs for longer where required or permitted by law.
        </p>
        <button className="flex h-[26px] items-center justify-center rounded-md border border-[#ab413e]/30 bg-[#fff0ee] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95">
          Request to delete account
        </button>
      </div>
    </div>
  );
}
