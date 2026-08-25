import { ShieldCheck, Sparkles } from "lucide-react";

export function AdvisorPanel() {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-medium text-[#030303]">
          Advisor found no issues
        </h2>
        <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-3 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
          <Sparkles className="size-3.5" />
          Ask Assistant
        </button>
      </div>
      <div className="w-full pt-[26px]">
        <div className="flex h-64 w-full items-center justify-center rounded-md border border-black/8 bg-white">
          <div className="flex items-center gap-2 text-[#464646]">
            <ShieldCheck className="size-5" />
            <p className="text-[15px]">No security or performance issues found</p>
          </div>
        </div>
      </div>
    </div>
  );
}
