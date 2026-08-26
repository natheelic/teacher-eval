import { Globe, Info } from "lucide-react";
import { SectionHeading, SettingsCard } from "../account/SettingsPrimitives";

export type CustomDomainsProps = {
  plan: "FREE" | "PRO" | "TEAM" | "ENTERPRISE";
  domains: { id: string; hostname: string; status: string }[];
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "border-[#16b674] bg-[#3fcf8e]/10 text-[#097c4f]",
  PENDING_VERIFICATION: "border-[#f3ba63] bg-[#ca8a10]/10 text-[#dc7b18]",
  VERIFYING: "border-[#f3ba63] bg-[#ca8a10]/10 text-[#dc7b18]",
  FAILED: "border-[#ab413e]/40 bg-[#ab413e]/10 text-[#ab413e]",
};

function statusLabel(status: string): string {
  return status.toLowerCase().replace(/_/g, " ");
}

export function CustomDomains({ plan, domains }: CustomDomainsProps) {
  // The plan gates the whole feature: free organizations see the upsell.
  if (plan === "FREE") {
    return (
      <div className="flex w-full flex-col items-start gap-6">
        <SectionHeading
          title="Custom domains"
          description="Present a branded experience to your users"
        />
        <div className="flex w-full max-w-[688px] flex-col items-start gap-3 rounded-lg border border-black/8 bg-black/[0.01] p-4 sm:flex-row">
          <span className="flex size-[23px] shrink-0 items-center justify-center rounded bg-[#696969]">
            <Info className="size-[15px] text-white" />
          </span>
          <div className="flex flex-1 flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex flex-col items-start">
              <p className="text-[13px] font-semibold text-[#030303]">
                Custom domains are a Pro Plan add-on
              </p>
              <p className="text-[13px] font-medium text-[#464646]">
                Paid Plans come with free vanity subdomains or Custom Domains
                for an additional $10/month per domain.
              </p>
            </div>
            <button className="flex h-[26px] shrink-0 items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Custom domains"
        description="Present a branded experience to your users"
      />
      <SettingsCard>
        {domains.length === 0 ? (
          <div className="flex w-full flex-col items-center gap-1 p-8 text-center">
            <p className="text-[13px] font-medium text-[#030303]">
              No custom domains yet
            </p>
            <p className="text-[13px] font-medium text-[#696969]">
              Add one to serve this project from your own hostname.
            </p>
          </div>
        ) : (
          domains.map((domain, i) => (
            <div
              key={domain.id}
              className={`flex w-full items-center justify-between gap-3 p-4 ${
                i < domains.length - 1 ? "border-b border-black/8" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Globe className="size-4 shrink-0 text-[#464646]" />
                <span className="truncate text-[13px] font-medium text-[#030303]">
                  {domain.hostname}
                </span>
              </span>
              <span
                className={`flex shrink-0 items-center rounded-full border px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] ${
                  STATUS_STYLES[domain.status] ??
                  "border-black/15 bg-white text-[#464646]"
                }`}
              >
                {statusLabel(domain.status)}
              </span>
            </div>
          ))
        )}
      </SettingsCard>
    </div>
  );
}
