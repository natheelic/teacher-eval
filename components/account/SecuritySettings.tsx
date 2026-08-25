"use client";

import { useState } from "react";
import { Laptop, Smartphone, X } from "lucide-react";
import { SectionHeading, SettingsCard, SettingsRow } from "./SettingsPrimitives";
import { Switch } from "./Switch";

type Session = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
  icon: typeof Laptop;
};

const INITIAL_SESSIONS: Session[] = [
  {
    id: "sess_1",
    device: "Chrome on macOS",
    location: "This device",
    lastActive: "Active now",
    current: true,
    icon: Laptop,
  },
  {
    id: "sess_2",
    device: "Safari on iOS",
    location: "Last seen 2 days ago",
    lastActive: "2 days ago",
    icon: Smartphone,
  },
];

function PasswordSection() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Password" description="" />
      <SettingsCard>
        <div className="flex w-full flex-col items-start gap-3 border-b border-black/8 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">
              Current password
            </label>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 sm:w-[262px]"
          />
        </div>
        <div className="flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:gap-6">
          <div className="flex flex-1 flex-col items-start">
            <label className="text-[13px] font-medium text-[#030303]">
              New password
            </label>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="h-[34px] w-full shrink-0 rounded-md border border-black/15 bg-black/[0.01] px-3 text-[13px] font-medium text-[#030303] outline-none focus:border-black/30 sm:w-[262px]"
          />
        </div>
        <div className="flex w-full items-center justify-end p-4">
          <button
            disabled
            className="flex h-[26px] items-center justify-center rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] opacity-50"
          >
            Update password
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}

function TwoFactorSection() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading title="Two-factor authentication" description="" />
      <SettingsCard>
        <SettingsRow
          bordered={false}
          label="Require a second factor to sign in"
          description="Add an extra layer of security using an authenticator app."
          control={<Switch />}
        />
      </SettingsCard>
    </div>
  );
}

function ActiveSessionsSection() {
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);

  function handleRevoke(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Active sessions"
        description="Devices currently signed in to your account."
      />
      <SettingsCard>
        {sessions.map((session, i) => (
          <div
            key={session.id}
            className={`flex w-full items-center justify-between p-4 ${
              i < sessions.length - 1 ? "border-b border-black/8" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-black/4 text-[#464646]">
                <session.icon className="size-4" />
              </span>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-[#030303]">
                    {session.device}
                  </p>
                  {session.current && (
                    <span className="flex items-center rounded-full border border-[#16b674] bg-[#3fcf8e]/10 px-[5.5px] py-[3px] text-[9px] font-medium uppercase tracking-[0.63px] text-[#097c4f]">
                      This device
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-[#696969]">
                  {session.location} · {session.lastActive}
                </p>
              </div>
            </div>
            {!session.current && (
              <button
                onClick={() => handleRevoke(session.id)}
                className="flex size-7 items-center justify-center rounded-md hover:bg-black/4"
              >
                <X className="size-3.5 text-[#464646]" />
              </button>
            )}
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}

export function SecuritySettings() {
  return (
    <div className="flex w-full flex-col gap-16">
      <PasswordSection />
      <TwoFactorSection />
      <ActiveSessionsSection />
    </div>
  );
}
