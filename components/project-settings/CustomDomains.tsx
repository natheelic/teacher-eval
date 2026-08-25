import { Info } from "lucide-react";
import { SectionHeading } from "../account/SettingsPrimitives";

export function CustomDomains() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Custom domains"
        description="Present a branded experience to your users"
      />
      <div className="flex w-[688px] items-start gap-3 rounded-lg border border-black/8 bg-black/[0.01] p-4">
        <span className="flex size-[23px] shrink-0 items-center justify-center rounded bg-[#696969]">
          <Info className="size-[15px] text-white" />
        </span>
        <div className="flex flex-1 items-center justify-between gap-8">
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
