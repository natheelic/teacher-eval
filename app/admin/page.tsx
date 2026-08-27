import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-session";

/**
 * /admin is now a section rather than a page (ROADMAP 7.3). The guard runs
 * here before the redirect so a non-admin still lands on /dashboard directly,
 * rather than bouncing through a sub-route first — preserving the behaviour
 * verified when the admin panel shipped.
 */
export default async function AdminPage() {
  await requireAdmin();
  redirect("/admin/branding");
}
