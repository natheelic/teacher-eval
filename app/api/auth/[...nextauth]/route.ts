import { handlers } from "@/auth";

// Prisma and bcrypt both need Node built-ins.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
