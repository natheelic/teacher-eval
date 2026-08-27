import { AlertTriangle } from "lucide-react";
import { SectionHeading } from "./SettingsPrimitives";
import { AccountDeletionButton } from "./AccountDeletionButton";
import { formatDate } from "@/lib/format";

export function DangerZone({
  deletionRequestedAt,
  hasPassword,
  appName,
}: {
  deletionRequestedAt: string | null;
  hasPassword: boolean;
  appName: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Danger zone"
        description={`Permanently delete your ${appName} account and data.`}
      />
      <div className="relative flex w-full max-w-[688px] flex-col items-start gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4 pl-10">
        <AlertTriangle className="absolute left-4 top-4 size-[18px] text-danger" />
        <p className="text-[13px] font-semibold text-foreground">
          Request for account deletion
        </p>
        <p className="-mt-2 text-[13px] font-medium text-foreground-secondary">
          Deleting your account is permanent and cannot be undone. Your data
          will be deleted within 30 days, but we may retain some metadata and
          logs for longer where required or permitted by law.
        </p>
        {deletionRequestedAt && (
          <p className="-mt-1 text-[13px] font-semibold text-danger">
            Deletion requested on {formatDate(deletionRequestedAt)}.
          </p>
        )}
        <AccountDeletionButton
          requested={Boolean(deletionRequestedAt)}
          hasPassword={hasPassword}
        />
      </div>
    </div>
  );
}
