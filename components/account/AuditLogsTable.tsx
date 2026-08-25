import { ChevronDown, Clock, RefreshCw, ArrowDown } from "lucide-react";

type LogRow = {
  status: string;
  method: string;
  action: string;
  target: string | null;
  ref: string | null;
  date: string;
};

const ROWS: LogRow[] = [
  {
    status: "201",
    method: "POST",
    action: "Gets project's logs from the unified logs stream",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:53:05",
  },
  {
    status: "201",
    method: "POST",
    action: "Gets project's logs from the unified logs stream",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:53:04",
  },
  {
    status: "201",
    method: "POST",
    action: "Gets project's logs from the unified logs stream",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:53:04",
  },
  {
    status: "201",
    method: "POST",
    action: "[Beta] Gets project's network bans",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:52:55",
  },
  {
    status: "200",
    method: "GET",
    action: "Gets project's postgrest config",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:52:54",
  },
  {
    status: "200",
    method: "GET",
    action: "Get project api keys",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:52:54",
  },
  {
    status: "200",
    method: "GET",
    action: "Gets project's settings",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:52:54",
  },
  {
    status: "200",
    method: "GET",
    action: "Get project api keys",
    target: "Project: oas-eleccom",
    ref: "Ref: zptgdwrrvktjdtxjrvyf",
    date: "24 Aug 26 11:52:54",
  },
  {
    status: "201",
    method: "POST",
    action: "Logged into account",
    target: null,
    ref: null,
    date: "24 Aug 26 11:52:47",
  },
];

export function AuditLogsTable() {
  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex w-full items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <span className="pr-2 text-xs font-medium text-[#464646]">Filter by</span>
          <button className="flex h-[26px] items-center gap-2 rounded-md border border-dashed border-black/15 px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            Projects
            <ChevronDown className="size-3.5" />
          </button>
          <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
            <Clock className="size-3.5" />
            23 Aug, 11:53 - 24 Aug, 11:53
          </button>
          <span className="mx-2 h-5 w-px bg-black/15" />
          <span className="text-xs font-medium text-[#464646]">
            Viewing {ROWS.length} logs in total
          </span>
        </div>
        <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="w-full overflow-hidden rounded-md border border-black/8">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-black/[0.03]">
              <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
                Action
              </th>
              <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
                Target
              </th>
              <th className="border-b border-black/8 px-4 py-3 text-[13px] font-medium text-[#464646]">
                <span className="inline-flex items-center gap-2">
                  Date
                  <ArrowDown className="size-3.5" />
                </span>
              </th>
              <th className="border-b border-black/8 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const isLast = i === ROWS.length - 1;
              const cellBorder = isLast ? "" : "border-b border-black/8";
              return (
                <tr key={i} className="bg-white">
                  <td className={`${cellBorder} px-4 py-3 align-top`}>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center rounded border border-black/8 bg-black/[0.03] px-1 font-mono text-xs text-[#6f6f6f]">
                        {row.status}
                      </span>
                      <span className="font-mono text-xs text-[#464646]">
                        {row.method}
                      </span>
                      <span className="text-[13px] text-[#6f6f6f]">
                        {row.action}
                      </span>
                    </div>
                  </td>
                  <td className={`${cellBorder} px-4 py-3 align-top`}>
                    {row.target ? (
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#464646]">
                          {row.target}
                        </span>
                        <span className="text-xs font-medium text-[#464646]">
                          {row.ref}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] font-medium text-[#464646]">-</span>
                    )}
                  </td>
                  <td className={`${cellBorder} px-4 py-3 align-top text-[13px] text-[#6f6f6f]`}>
                    {row.date}
                  </td>
                  <td className={`${cellBorder} px-4 py-3 text-right align-top`}>
                    <button className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
                      View details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
