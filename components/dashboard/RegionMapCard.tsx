import { Database, ChevronLeft, ChevronRight } from "lucide-react";

export function RegionMapCard() {
  return (
    <div className="flex h-[500px] w-full flex-col items-start">
      <div className="relative flex h-[500px] w-full flex-col items-start overflow-hidden rounded-md border border-black/8">
        {/* decorative grid background standing in for the infra map */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(3,3,3,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(3,3,3,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 55%, black 40%, transparent 100%)",
          }}
        />

        <div className="absolute left-[226px] top-[197px] w-[293px] rounded-[4px] border-[0.9px] border-black/8 bg-white shadow-sm">
          <div className="flex w-full items-start justify-between p-[11px]">
            <div className="flex gap-[11px]">
              <div className="flex size-[29px] shrink-0 items-center justify-center rounded-[5px] border-[0.9px] border-[#097c4f] bg-[#16b674]">
                <Database className="size-[14px] text-white" />
              </div>
              <div className="flex flex-col gap-[2px]">
                <p className="text-[11.7px] font-medium text-[#030303]">
                  Primary Database
                </p>
                <p className="text-[11.7px] font-medium text-[#464646]">
                  Southeast Asia (Singapore)
                </p>
                <div className="flex items-center gap-1 text-[11.7px] font-medium">
                  <span className="text-[#464646]">ap-southeast-1</span>
                  <span className="text-[#696969]">·</span>
                  <span className="text-[#464646]">t4g.nano</span>
                </div>
              </div>
            </div>
            <div className="flex h-[15px] w-[29px] items-center justify-center rounded-[2px] bg-[#dc2626]" />
          </div>
          <div className="flex items-center gap-[11px] border-t-[0.9px] border-black/8 px-[11px] py-[7px] text-[10.8px] font-medium">
            <span className="text-[#030303]">
              CPU <span className="text-[#464646]">2%</span>
            </span>
            <span className="text-[#696969]">·</span>
            <span className="text-[#030303]">
              Disk <span className="text-[#464646]">4%</span>
            </span>
            <span className="text-[#696969]">·</span>
            <span className="text-[#030303]">
              RAM <span className="text-[#464646]">43%</span>
            </span>
            <span className="text-[#696969]">·</span>
            <span className="text-[#464646]">5/60 conns</span>
          </div>
        </div>

        <div className="absolute right-4 top-4 flex items-center">
          <button className="flex h-[26px] items-center justify-center rounded-l-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 hover:bg-black/4">
            <ChevronLeft className="size-3.5 text-[#464646]" />
          </button>
          <button className="flex h-[26px] items-center justify-center rounded-r-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 opacity-50">
            <ChevronRight className="size-3.5 text-[#464646]" />
          </button>
        </div>
      </div>
    </div>
  );
}
