import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** DeviceSession id — used to mark "this device" and to revoke. */
      sid?: string;
    } & DefaultSession["user"];
  }
}

// The JWT interface lives in @auth/core/jwt; `next-auth/jwt` only re-exports
// it, and augmenting a re-export would declare a separate, unused interface.
declare module "@auth/core/jwt" {
  interface JWT {
    /** User id. */
    uid?: string;
    /** DeviceSession id, stamped at sign-in. */
    sid?: string;
  }
}

export {};
