import { Mail, Lock, GitFork, Pencil, RefreshCw } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";

type Method = {
  icon: React.ComponentType<{ className?: string }>;
  iconWrap?: string;
  name: string;
  detail: string;
  action?: React.ReactNode;
};

const METHODS: Method[] = [
  {
    icon: Mail,
    iconWrap: "bg-black/4 text-[#464646]",
    name: "Email",
    detail: "you@example.com",
    action: (
      <button className="flex h-[26px] items-center justify-center rounded-md border border-black/15 bg-[#fdfdfd] px-2.5 py-1 text-xs font-medium text-[#030303] hover:bg-black/4">
        Change password
      </button>
    ),
  },
  {
    icon: Lock,
    iconWrap: "bg-black/4 text-[#696969]",
    name: "Vercel Marketplace",
    detail: "you@example.com",
  },
  {
    icon: Lock,
    iconWrap: "bg-black/4 text-[#696969]",
    name: "Vercel Marketplace",
    detail: "you@example.com",
  },
  {
    icon: GitFork,
    iconWrap: "bg-[#030303] text-white",
    name: "GitHub",
    detail: "you · you@example.com",
  },
];

export function SignInMethods() {
  return (
    <div className="flex w-full flex-col items-start gap-6">
      <SectionHeading
        title="Sign-in methods"
        description="Manage the providers linked to your {{APP_NAME}} account and update their details."
      />
      <SettingsCard>
        {METHODS.map((m, i) => (
          <div
            key={i}
            className={`flex w-full items-center justify-between p-4 ${
              i < METHODS.length - 1 ? "border-b border-black/8" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`flex size-[30px] shrink-0 items-center justify-center rounded-md ${m.iconWrap}`}
              >
                <m.icon className="size-4" />
              </span>
              <div className="flex flex-col items-start">
                <p className="text-[13px] font-medium capitalize text-[#030303]">
                  {m.name}
                </p>
                <p className="text-[13px] font-medium text-[#696969]">
                  {m.detail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {m.action}
              <button className="flex size-7 items-center justify-center rounded-md hover:bg-black/4">
                <Pencil className="size-3.5 text-[#464646]" />
              </button>
              <button className="flex size-7 items-center justify-center rounded-md hover:bg-black/4">
                <RefreshCw className="size-3.5 text-[#464646]" />
              </button>
            </div>
          </div>
        ))}
      </SettingsCard>
    </div>
  );
}
