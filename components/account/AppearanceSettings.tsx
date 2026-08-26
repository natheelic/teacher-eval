"use client";

import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import { type ThemeMode } from "../theme/useTheme";
import { useSyncedTheme } from "../theme/useSyncedTheme";
import { SidebarBehaviorSelect } from "./SidebarBehaviorSelect";
import { appName } from "@/lib/app-config";

type ThemeOption = {
  key: ThemeMode;
  label: string;
  preview: string;
};

const THEMES: ThemeOption[] = [
  { key: "system", label: "System", preview: "linear-gradient(135deg, #fdfdfd 50%, #1c1c1c 50%)" },
  { key: "light", label: "Light", preview: "#fdfdfd" },
  { key: "dark", label: "Dark", preview: "#1c1c1c" },
];

function ThemeSwatch({
  option,
  selected,
  onSelect,
}: {
  option: ThemeOption;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full flex-col items-start gap-2 rounded-md border p-3 text-left shadow-sm sm:w-[206px] ${
        selected ? "border-black/30 bg-black/4" : "border-black/15 bg-black/[0.03]"
      }`}
    >
      <div
        className="h-[97px] w-full rounded border border-black/10"
        style={{ background: option.preview }}
      />
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 flex size-3 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-[#030303]" : "border-black/20"
          }`}
        >
          {selected && <span className="size-[10px] rounded-full border border-white bg-[#030303]" />}
        </span>
        <span
          className={`text-xs font-medium ${
            selected ? "text-[#030303]" : "text-[#464646]"
          }`}
        >
          {option.label}
        </span>
      </div>
    </button>
  );
}

export type AppearanceSettingsProps = {
  theme: "LIGHT" | "DARK" | "SYSTEM";
  sidebarBehavior: "OPEN" | "CLOSED" | "EXPAND_ON_HOVER";
};

export function AppearanceSettings({
  theme,
  sidebarBehavior,
}: AppearanceSettingsProps) {
  const { mode, setMode } = useSyncedTheme(theme);

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Appearance"
        description={`Choose how ${appName} looks and behaves in the dashboard.`}
      />
      <SettingsCard>
        <div className="flex w-full flex-col gap-6 border-b border-black/8 p-4 sm:flex-row">
          <div className="flex w-full shrink-0 flex-col items-start gap-2 sm:w-[202px]">
            <p className="text-[13px] font-medium text-[#030303]">Theme mode</p>
            <p className="text-[13px] font-medium text-[#464646]">
              Choose how {appName} looks to you. Select a single theme, or sync
              with your system.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
            {THEMES.map((t) => (
              <ThemeSwatch
                key={t.key}
                option={t}
                selected={mode === t.key}
                onSelect={() => setMode(t.key)}
              />
            ))}
          </div>
        </div>
        <SettingsRow
          bordered={false}
          label="Sidebar behavior"
          description="Choose your preferred sidebar behavior: open, closed, or expand on hover."
          control={<SidebarBehaviorSelect value={sidebarBehavior} />}
        />
      </SettingsCard>
    </div>
  );
}
