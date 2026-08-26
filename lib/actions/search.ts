"use server";

import { searchUsersForPalette, type UserSearchHit } from "@/lib/queries/users";
import { searchAuditLogsForPalette, type AuditSearchHit } from "@/lib/queries/audit";

export type PaletteSearchResult = {
  users: UserSearchHit[];
  auditLogs: AuditSearchHit[];
};

/** Called directly from the ⌘K command palette — a read, not a mutation, but
 * still needs the Server Action boundary to be callable from a Client
 * Component at all. */
export async function searchPalette(query: string): Promise<PaletteSearchResult> {
  const [users, auditLogs] = await Promise.all([
    searchUsersForPalette(query),
    searchAuditLogsForPalette(query),
  ]);
  return { users, auditLogs };
}
