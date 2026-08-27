import { KeyRound } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { ConnectionButton } from "./ConnectionButton";
import type { ConnectionView } from "@/lib/queries/account";
import { appName } from "@/lib/app-config";

const DESCRIPTIONS: Record<string, string> = {
  google: `Use your Google account to sign in to ${appName}.`,
};

export function Connections({
  connections,
  canDisconnect,
}: {
  connections: ConnectionView[];
  canDisconnect: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Connections"
        description={`Connect your ${appName} account with other services.`}
      />
      <SettingsCard>
        {connections.map((connection, i) => (
          <div
            key={connection.provider}
            className={`flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
              i < connections.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-[#030303] text-white">
                <KeyRound className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col items-start">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-foreground">
                    {connection.providerLabel}
                  </p>
                  {connection.connected && (
                    <span className="flex items-center rounded-full border border-success bg-success/10 px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-success-strong">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-foreground-muted">
                  {connection.accountLabel ??
                    DESCRIPTIONS[connection.provider] ??
                    "Not connected"}
                </p>
              </div>
            </div>
            <ConnectionButton
              provider={connection.provider}
              connected={connection.connected}
              canDisconnect={canDisconnect}
            />
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}
