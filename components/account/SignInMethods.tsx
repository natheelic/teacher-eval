import { Mail, Lock, KeyRound } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { UnlinkProviderButton } from "./UnlinkProviderButton";
import type { SignInMethodView } from "@/lib/queries/account";
import { appName } from "@/lib/env";

// Icons cannot live in the database, so the provider discriminator picks one.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  credentials: Mail,
  google: KeyRound,
};

const ICON_WRAPS: Record<string, string> = {
  credentials: "bg-black/4 text-[#464646]",
  google: "bg-black/4 text-[#696969]",
};

export function SignInMethods({
  methods,
  hasPassword,
}: {
  methods: SignInMethodView[];
  hasPassword: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Sign-in methods"
        description={`Manage the providers linked to your ${appName} account and update their details.`}
      />
      <SettingsCard>
        {methods.length === 0 && (
          <p className="p-4 text-[13px] font-medium text-[#696969]">
            No sign-in methods linked.
          </p>
        )}
        {methods.map((method, i) => {
          const Icon = ICONS[method.provider] ?? Lock;
          return (
            <div
              key={`${method.provider}-${i}`}
              className={`flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                i < methods.length - 1 ? "border-b border-black/8" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className={`flex size-[30px] shrink-0 items-center justify-center rounded-md ${
                    ICON_WRAPS[method.provider] ?? "bg-black/4 text-[#696969]"
                  }`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col items-start">
                  <p className="text-[13px] font-medium capitalize text-[#030303]">
                    {method.providerLabel}
                  </p>
                  <p className="truncate text-[13px] font-medium text-[#696969]">
                    {method.detail}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {method.canChangePassword && (
                  <ChangePasswordDialog hasPassword={hasPassword} />
                )}
                {method.canUnlink && (
                  <UnlinkProviderButton
                    provider={method.provider}
                    providerLabel={method.providerLabel}
                  />
                )}
              </div>
            </div>
          );
        })}
      </SettingsCard>
    </div>
  );
}
