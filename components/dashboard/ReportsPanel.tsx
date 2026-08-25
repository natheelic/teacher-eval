import { Plus } from "lucide-react";

export function ReportsPanel() {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-medium text-[#030303]">Reports</h2>
        <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-3 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
          <Plus className="size-3.5" />
          Add block
        </button>
      </div>
      <div className="w-full pt-[26px]">
        <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-md border border-black/8 bg-white">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-[15px] font-medium text-[#030303]">
              Build a custom report
            </p>
            <p className="max-w-[262px] text-[15px] text-[#464646]">
              Keep track of your most important metrics
            </p>
          </div>
          <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-3 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            Add your first block
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
