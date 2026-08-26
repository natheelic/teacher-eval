"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role, UserStatus } from "@/lib/generated/prisma/enums";

const ROLES: Role[] = ["ADMIN", "MANAGER", "MEMBER", "VIEWER"];
const STATUSES: UserStatus[] = ["ACTIVE", "INVITED", "SUSPENDED"];

const controlClass =
  "h-[26px] rounded-md border border-black/15 bg-[#fdfdfd] px-2 text-xs font-medium text-[#030303] outline-none hover:bg-black/4 disabled:opacity-50";

export function UserFilters({
  query,
  role,
  status,
  total,
}: {
  query: string;
  role: Role | null;
  status: UserStatus | null;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: URLSearchParams) {
    next.delete("cursor"); // paging is relative to the filter
    startTransition(() => {
      const qs = next.toString();
      router.replace(qs ? `/?${qs}` : "/");
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    apply(next);
  }

  return (
    <form
      className="flex w-full flex-wrap items-center justify-between gap-2 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        setParam("q", value || null);
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-[#696969]" />
          {/* Uncontrolled with a key: no mirrored state to keep in sync, and
              changing the URL (back button, Clear filters) remounts it with
              the new value. */}
          <input
            key={query}
            name="q"
            defaultValue={query}
            placeholder="Search name or email"
            aria-label="Search users"
            className={`${controlClass} w-56 pl-7`}
          />
        </span>

        <select
          aria-label="Filter by role"
          value={role ?? ""}
          disabled={pending}
          onChange={(e) => setParam("role", e.target.value || null)}
          className={controlClass}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={status ?? ""}
          disabled={pending}
          onChange={(e) => setParam("status", e.target.value || null)}
          className={controlClass}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        <span className="mx-2 h-5 w-px bg-black/15" />
        <span className="text-xs font-medium text-[#464646]">
          {total} {total === 1 ? "user" : "users"}
        </span>
      </div>

      {(query || role || status) && (
        <button
          type="button"
          disabled={pending}
          onClick={() => apply(new URLSearchParams())}
          className={controlClass}
        >
          Clear filters
        </button>
      )}
    </form>
  );
}
