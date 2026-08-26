import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/require-session";
import { toIso } from "@/lib/format";

export type ConnectionView = {
  provider: string;
  providerLabel: string;
  connected: boolean;
  accountLabel: string | null;
};

const PROVIDER_LABELS: Record<string, string> = {
  credentials: "Email",
  google: "Google",
  github: "GitHub",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

/** Providers offered as linkable connections, whether or not they're linked. */
const LINKABLE = ["google"] as const;

export const getConnections = cache(async (): Promise<ConnectionView[]> => {
  const user = await requireUser();

  const accounts = await prisma.account.findMany({
    where: { userId: user.id, provider: { in: [...LINKABLE] } },
    select: { provider: true },
  });
  const linked = new Set(accounts.map((a) => a.provider));

  return LINKABLE.map((provider) => ({
    provider,
    providerLabel: providerLabel(provider),
    connected: linked.has(provider),
    accountLabel: linked.has(provider) ? user.email : null,
  }));
});

export type PreferencesView = {
  theme: "LIGHT" | "DARK" | "SYSTEM";
};

export const getPreferences = cache(async (): Promise<PreferencesView> => {
  const user = await requireUser();

  // Accounts created before preferences existed (or via OAuth) may not have a
  // row yet, so fall back to the schema defaults rather than failing.
  const row = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
  });

  return {
    theme: row?.theme ?? "SYSTEM",
  };
});

export type DeviceSessionView = {
  id: string;
  deviceLabel: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
};

export const getDeviceSessions = cache(async (): Promise<DeviceSessionView[]> => {
  const user = await requireUser();

  const rows = await prisma.deviceSession.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      deviceLabel: true,
      deviceType: true,
      ipAddress: true,
      location: true,
      lastActiveAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    deviceLabel: row.deviceLabel,
    deviceType: normaliseDeviceType(row.deviceType),
    location: row.location ?? row.ipAddress,
    lastActiveAt: row.lastActiveAt.toISOString(),
    isCurrent: row.id === user.sid,
  }));
});

function normaliseDeviceType(value: string): DeviceSessionView["deviceType"] {
  return value === "mobile" || value === "tablet" ? value : "desktop";
}

export type ApiTokenView = {
  id: string;
  name: string;
  preview: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  scopes: string[];
};

export const getApiTokens = cache(async (): Promise<ApiTokenView[]> => {
  const user = await requireUser();

  const rows = await prisma.apiToken.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      last4: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
      scopes: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    preview: `${row.prefix}_${"•".repeat(8)}${row.last4}`,
    createdAt: row.createdAt.toISOString(),
    lastUsedAt: toIso(row.lastUsedAt),
    expiresAt: toIso(row.expiresAt),
    scopes: row.scopes,
  }));
});
