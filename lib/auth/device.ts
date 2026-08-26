import { UAParser } from "ua-parser-js";

export type DeviceInfo = {
  deviceLabel: string;
  deviceType: "desktop" | "mobile" | "tablet";
  userAgent: string | null;
  ipAddress: string | null;
};

/**
 * Turns a User-Agent string into the "Chrome on macOS" label the security page
 * shows, plus a coarse device type the component maps to an icon.
 */
export function parseDevice(
  userAgent: string | null,
  ipAddress: string | null,
): DeviceInfo {
  if (!userAgent) {
    return {
      deviceLabel: "Unknown device",
      deviceType: "desktop",
      userAgent: null,
      ipAddress,
    };
  }

  const { browser, os, device } = UAParser(userAgent);

  const browserName = browser.name ?? "Unknown browser";
  const osName = os.name ?? "Unknown OS";
  const deviceLabel = `${browserName} on ${osName}`;

  const deviceType: DeviceInfo["deviceType"] =
    device.type === "mobile"
      ? "mobile"
      : device.type === "tablet"
        ? "tablet"
        : "desktop";

  return { deviceLabel, deviceType, userAgent, ipAddress };
}

/**
 * Best-effort client IP. `x-forwarded-for` is a comma-separated chain when a
 * proxy is in front, and the client is the first entry.
 */
export function clientIpFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip");
}
