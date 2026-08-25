"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";

type ThemeOption = {
  key: string;
  label: string;
  preview: string;
};

const THEMES: ThemeOption[] = [
  { key: "system", label: "System", preview: "linear-gradient(135deg, #fdfdfd 50%, #1c1c1c 50%)" },
  { key: "dark", label: "Dark", preview: "#1c1c1c" },
  { key: "light", label: "Light", preview: "#fdfdfd" },
  { key: "classic-dark", label: "Classic Dark", preview: "#171717" },
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
      className={`flex w-[206px] flex-col items-start gap-2 rounded-md border p-3 text-left shadow-sm ${
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

export function AppearanceSettings() {
  const [theme, setTheme] = useState("system");

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Appearance"
        description="Choose how {{APP_NAME}} looks and behaves in the dashboard."
      />
      <SettingsCard>
        <div className="flex w-full gap-6 border-b border-black/8 p-4">
          <div className="flex w-[202px] shrink-0 flex-col items-start gap-2">
            <p className="text-[13px] font-medium text-[#030303]">Theme mode</p>
            <p className="text-[13px] font-medium text-[#464646]">
              Choose how {"{{APP_NAME}}"} looks to you. Select a single theme, or
              sync with your system.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {THEMES.map((t) => (
              <ThemeSwatch
                key={t.key}
                option={t}
                selected={theme === t.key}
                onSelect={() => setTheme(t.key)}
              />
            ))}
          </div>
        </div>
        <SettingsRow
          bordered={false}
          label="Sidebar behavior"
          description="Choose your preferred sidebar behavior: open, closed, or expand on hover."
          control={
            <button className="flex h-[34px] w-full items-center justify-between rounded-md border border-black/15 px-3 text-[13px] font-medium text-[#030303] hover:bg-black/[0.02]">
              Expand on hover
              <ChevronDown className="size-4 text-[#696969]" />
            </button>
          }
        />
      </SettingsCard>
    </div>
  );
}
