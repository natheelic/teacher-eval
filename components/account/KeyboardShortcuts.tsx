import { SectionHeading, SettingsCard } from "./SettingsPrimitives";
import { Switch } from "./Switch";

const SHORTCUTS = [
  { label: "Open command menu", keys: "⌘K" },
  { label: "Toggle AI Assistant panel", keys: "⌘I" },
  { label: "Toggle inline editor", keys: "⌘E" },
  { label: "Copy results as Markdown", keys: "⌘⇧M" },
  { label: "Copy results as JSON", keys: "⌘⇧J" },
  { label: "Copy results as CSV", keys: "⌘⇧C" },
  { label: "Download results as CSV", keys: "⌘⇧D" },
  { label: "Publish OAuth app", keys: "⇧N" },
  { label: "Invite members", keys: "⇧N" },
  { label: "Add project connection", keys: "⇧N" },
  { label: "New project", keys: "⇧N" },
  { label: "Create private app", keys: "⇧N" },
  { label: "Refresh audit logs", keys: "⇧R" },
];

export function KeyboardShortcuts() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Keyboard shortcuts"
        description="Choose which shortcuts stay active while working in the dashboard."
      />
      <SettingsCard>
        {SHORTCUTS.map((s, i) => (
          <div
            key={i}
            className={`flex w-full items-center justify-between px-4 py-4 ${
              i < SHORTCUTS.length - 1 ? "border-b border-black/8" : ""
            }`}
          >
            <p className="text-[13px] font-medium text-[#030303]">{s.label}</p>
            <div className="flex items-center gap-[10px]">
              <span className="rounded bg-black/[0.03] px-1.5 py-0.5 text-[11px] font-medium tracking-[-0.275px] text-[#696969]">
                {s.keys}
              </span>
              <Switch defaultChecked />
            </div>
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}
