import { AlertTriangle } from "lucide-react";
import { SectionHeading } from "./SettingsPrimitives";
import { AccountDeletionButton } from "./AccountDeletionButton";
import { formatDate } from "@/lib/format";
import { appName } from "@/lib/app-config";

export function DangerZone({
  deletionRequestedAt,
}: {
  deletionRequestedAt: string | null;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Danger zone"
        description={`Permanently delete your ${appName} account and data.`}
      />
      <div className="relative flex w-full max-w-[688px] flex-col items-start gap-3 rounded-lg border border-[#fdd8d3] bg-[#fffcfc] p-4 pl-10">
        <AlertTriangle className="absolute left-4 top-4 size-[18px] text-[#ab413e]" />
        <p className="text-[13px] font-semibold text-[#030303]">
          Request for account deletion
        </p>
        <p className="-mt-2 text-[13px] font-medium text-[#464646]">
          Deleting your account is permanent and cannot be undone. Your data
          will be deleted within 30 days, but we may retain some metadata and
          logs for longer where required or permitted by law.
        </p>
        {deletionRequestedAt && (
          <p className="-mt-1 text-[13px] font-semibold text-[#ab413e]">
            Deletion requested on {formatDate(deletionRequestedAt)}.
          </p>
        )}
        <AccountDeletionButton requested={Boolean(deletionRequestedAt)} />
      </div>
    </div>
  );
}
