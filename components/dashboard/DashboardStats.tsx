import Link from "next/link";
import { getUserStats } from "@/lib/queries/users";

const CARDS: {
  label: string;
  key: "total" | "active" | "suspended" | "admins";
  href: string;
}[] = [
  { label: "Total users", key: "total", href: "/users" },
  { label: "Active", key: "active", href: "/users?status=ACTIVE" },
  { label: "Suspended", key: "suspended", href: "/users?status=SUSPENDED" },
  { label: "Admins", key: "admins", href: "/users?role=ADMIN" },
];

/** Manager/admin only — the caller decides whether to render this. */
export async function DashboardStats() {
  const stats = await getUserStats();

  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
      {CARDS.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 hover:border-border-strong"
        >
          <span className="font-mono text-xs uppercase tracking-[0.6px] text-foreground-muted">
            {card.label}
          </span>
          <span className="font-display text-2xl font-semibold text-foreground">
            {stats[card.key]}
          </span>
        </Link>
      ))}
    </div>
  );
}
