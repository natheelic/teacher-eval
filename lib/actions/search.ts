"use server";

import { searchUsersForPalette, type UserSearchHit } from "@/lib/queries/users";

/** Called directly from the ⌘K command palette — a read, not a mutation, but
 * still needs the Server Action boundary to be callable from a Client
 * Component at all. */
export async function searchPalette(query: string): Promise<UserSearchHit[]> {
  return searchUsersForPalette(query);
}
