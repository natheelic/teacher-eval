"use client";

import { useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { SectionHeading, SettingsCard } from "./SettingsPrimitives";

type Token = {
  id: string;
  name: string;
  preview: string;
  created: string;
  lastUsed: string;
};

const INITIAL_TOKENS: Token[] = [
  {
    id: "tok_1",
    name: "CLI token",
    preview: "sk_live_••••••••a1b2",
    created: "12 Aug 2026",
    lastUsed: "2 hours ago",
  },
  {
    id: "tok_2",
    name: "CI/CD pipeline",
    preview: "sk_live_••••••••f7c3",
    created: "3 Jul 2026",
    lastUsed: "Never",
  },
];

let nextTokenId = 3;

export function AccessTokensTable() {
  const [tokens, setTokens] = useState<Token[]>(INITIAL_TOKENS);

  function handleGenerate() {
    const id = `tok_${nextTokenId++}`;
    const preview = `sk_live_••••••••${Math.random().toString(16).slice(2, 6)}`;
    setTokens((prev) => [
      ...prev,
      { id, name: "New token", preview, created: "Just now", lastUsed: "Never" },
    ]);
  }

  function handleRevoke(id: string) {
    setTokens((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="flex w-full flex-col items-start gap-6">
      <div className="flex w-full items-center justify-between">
        <SectionHeading
          title="Access tokens"
          description="Personal access tokens can be used to authenticate with the API."
        />
        <button
          onClick={handleGenerate}
          className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-[#16b674]/75 bg-[#72e3ad] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95"
        >
          <Plus className="size-3.5" />
          Generate new token
        </button>
      </div>
      <SettingsCard>
        {tokens.length === 0 ? (
          <div className="flex w-full flex-col items-center gap-1 p-8 text-center">
            <p className="text-[13px] font-medium text-[#030303]">
              No access tokens yet
            </p>
            <p className="text-[13px] font-medium text-[#696969]">
              Generate one to authenticate with the API.
            </p>
          </div>
        ) : (
          tokens.map((token, i) => (
            <div
              key={token.id}
              className={`flex w-full flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                i < tokens.length - 1 ? "border-b border-black/8" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-md bg-black/4 text-[#464646]">
                  <KeyRound className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col items-start">
                  <p className="text-[13px] font-medium text-[#030303]">
                    {token.name}
                  </p>
                  <p className="truncate font-mono text-xs font-medium text-[#696969]">
                    {token.preview}
                  </p>
                </div>
              </div>
              <div className="flex w-full shrink-0 items-center justify-between gap-6 sm:w-auto">
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-xs font-medium text-[#696969]">
                    Created {token.created}
                  </p>
                  <p className="text-xs font-medium text-[#696969]">
                    Last used: {token.lastUsed}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(token.id)}
                  className="flex h-[26px] shrink-0 items-center gap-2 rounded-md border border-[#ab413e]/30 bg-[#fff0ee] px-2.5 py-1 text-xs font-medium text-[#030303] hover:brightness-95"
                >
                  <Trash2 className="size-3.5" />
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </SettingsCard>
    </div>
  );
}
