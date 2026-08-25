import { Clock, ChevronRight } from "lucide-react";

type ChartCard = {
  title: string;
  count: number;
  faded?: boolean;
};

const CHARTS: ChartCard[] = [
  { title: "API Gateway", count: 0, faded: true },
  { title: "Storage", count: 0, faded: true },
  { title: "Realtime", count: 0, faded: true },
  { title: "Database", count: 0, faded: true },
  { title: "Functions", count: 0, faded: true },
  { title: "Authentication", count: 0, faded: true },
];

function Sparkline({ faded }: { faded?: boolean }) {
  return (
    <div className="flex h-[165px] w-full flex-col justify-end">
      <svg viewBox="0 0 334 140" className="h-[140px] w-full" preserveAspectRatio="none">
        <line x1="0" y1="139" x2="334" y2="139" stroke="rgba(3,3,3,0.08)" strokeWidth="1" />
        {!faded && (
          <rect x="318" y="30" width="4" height="109" rx="2" fill="#3fcf8e" />
        )}
      </svg>
      <div className="mt-2 flex w-full items-center justify-between text-[10px] text-[#696969]">
        <span>60 minutes ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function Card({ title, count, faded }: ChartCard) {
  return (
    <div
      className={`flex h-64 w-[368px] shrink-0 flex-col overflow-hidden rounded-lg border border-black/8 bg-white shadow-sm ${
        faded ? "opacity-60" : ""
      }`}
    >
      <div className="flex w-full items-end justify-between px-4 pt-4">
        <div className="flex flex-col items-start">
          <p className="font-mono text-xs font-semibold uppercase text-[#464646]">
            {title}
          </p>
          <p className="text-lg font-medium text-[#030303]">{count}</p>
        </div>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ca8a10]" />
              <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-[#464646]">
                Warnings
              </p>
            </div>
            <p className="text-[15px] font-medium text-[#030303]">0</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#ab413e]" />
              <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-[#464646]">
                Errors
              </p>
            </div>
            <p className="text-[15px] font-medium text-[#030303]">0</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Sparkline faded={faded} />
      </div>
    </div>
  );
}

export function UsageCharts() {
  return (
    <div className="flex w-full min-w-0 items-start gap-4">
      <div className="flex w-full min-w-0 flex-col items-start">
        <div className="flex w-full flex-wrap items-center gap-3 sm:flex-nowrap sm:justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-start gap-2">
              <p className="text-lg font-medium text-[#030303]">0</p>
              <p className="text-lg font-medium text-[#464646]">
                Total Requests
              </p>
            </div>
            <div className="flex items-start gap-2">
              <p className="text-lg font-medium text-[#030303]">—</p>
              <p className="text-lg font-medium text-[#464646]">
                Success Rate
              </p>
            </div>
          </div>
          <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            Last 60 minutes
            <Clock className="size-3.5" />
          </button>
        </div>

        <div className="relative flex w-full min-w-0 flex-col items-start pt-6">
          <div className="no-scrollbar flex w-full min-w-0 items-start gap-4 overflow-x-auto">
            {CHARTS.map((c) => (
              <Card key={c.title} {...c} />
            ))}
          </div>
          <button className="absolute right-0 top-[136px] flex size-8 items-center justify-center rounded-full border border-black/15 bg-[#fdfdfd] shadow-sm hover:bg-black/4">
            <ChevronRight className="size-4 text-[#464646]" />
          </button>
        </div>
      </div>
    </div>
  );
}
