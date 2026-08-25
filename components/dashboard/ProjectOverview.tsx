import { Copy, GitFork, GitBranch, Database, Archive, Cpu } from "lucide-react";

function StatIconBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-16 min-w-16 shrink-0 items-center justify-center rounded-md border border-black/8 bg-white">
      {children}
    </div>
  );
}

function StatusDots() {
  return (
    <div className="grid grid-cols-3 gap-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="size-1.5 rounded-full bg-[#3fcf8e]" />
      ))}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  muted,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  href?: boolean;
}) {
  const content = (
    <>
      <StatIconBox>{icon}</StatIconBox>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.6px] text-[#464646]">
          {label}
        </p>
        <div className="flex h-[34px] min-h-[34px] w-full items-center py-0.5">
          {typeof value === "string" ? (
            <p
              className={`text-[15px] font-medium ${
                muted ? "text-[#696969]" : "text-[#030303]"
              }`}
            >
              {value}
            </p>
          ) : (
            value
          )}
        </div>
      </div>
    </>
  );

  return href ? (
    <a href="#" className="flex items-center gap-4">
      {content}
    </a>
  ) : (
    <div className="flex items-center gap-4">{content}</div>
  );
}

export function ProjectOverview() {
  return (
    <div className="flex w-[744px] flex-col items-start">
      <div className="flex w-full items-center">
        <div className="flex flex-col items-start">
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.7px] text-[#030303]">
            oas-eleccom
          </h1>
          <div className="flex h-[38px] items-center gap-3 pt-3">
            <p className="text-[15px] font-medium text-[#464646]">
              https://zptgdwrrvktjdtxjrvyf.supabase.co
            </p>
            <button className="flex h-[26px] items-center gap-2 rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
              Copy
              <Copy className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-6 pt-8">
        <StatItem
          icon={<StatusDots />}
          label="Status"
          value="Healthy"
        />
        <StatItem
          icon={<Cpu className="size-[18px] text-[#464646]" />}
          label="Compute"
          value={
            <span className="flex items-center rounded border border-black/15 bg-white/50 px-[5.5px] py-[3px] font-mono text-[11px] font-medium uppercase tracking-[0.66px] text-[#464646]">
              nano
            </span>
          }
        />
        <StatItem
          icon={<GitFork className="size-[18px] text-[#464646]" />}
          label="GitHub"
          value="No repository connected"
          muted
          href
        />
        <StatItem
          icon={<GitBranch className="size-[18px] text-[#464646]" />}
          label="Recent branch"
          value="No branches"
          muted
          href
        />
        <StatItem
          icon={<Database className="size-[18px] text-[#464646]" />}
          label="Last migration"
          value="No migrations"
          muted
          href
        />
        <StatItem
          icon={<Archive className="size-[18px] text-[#464646]" />}
          label="Last backup"
          value="No backups"
          muted
          href
        />
      </div>
    </div>
  );
}
