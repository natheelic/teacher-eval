import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, clearRateLimit, recordFailure } from "@/lib/auth/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a key with no recorded failures", () => {
    expect(checkRateLimit("k1", 3)).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it("stays allowed while under the limit", () => {
    recordFailure("k2", 1000);
    recordFailure("k2", 1000);
    expect(checkRateLimit("k2", 3)).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it("blocks once the limit is reached", () => {
    recordFailure("k3", 1000);
    recordFailure("k3", 1000);
    recordFailure("k3", 1000);
    const result = checkRateLimit("k3", 3);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets once the window has elapsed", () => {
    recordFailure("k4", 1000);
    recordFailure("k4", 1000);
    recordFailure("k4", 1000);
    expect(checkRateLimit("k4", 3).allowed).toBe(false);

    vi.setSystemTime(1001);
    expect(checkRateLimit("k4", 3)).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it("clearRateLimit immediately un-blocks a key", () => {
    recordFailure("k5", 1000);
    recordFailure("k5", 1000);
    recordFailure("k5", 1000);
    expect(checkRateLimit("k5", 3).allowed).toBe(false);

    clearRateLimit("k5");
    expect(checkRateLimit("k5", 3)).toEqual({ allowed: true, retryAfterMs: 0 });
  });

  it("tracks independent keys independently", () => {
    recordFailure("k6a", 1000);
    recordFailure("k6a", 1000);
    recordFailure("k6a", 1000);
    expect(checkRateLimit("k6a", 3).allowed).toBe(false);
    expect(checkRateLimit("k6b", 3).allowed).toBe(true);
  });
});
