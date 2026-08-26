-- Strip the multi-tenant project/organization model down to users only.
--
-- Hand-ordered: `prisma migrate diff` emitted the enum swap before the tables
-- that depend on the old enum were dropped, and before `User.role` existed.
-- Dropping the dependants first makes the enum replacement a plain
-- DROP/CREATE, which is safe because no surviving column uses the old type.

-- 1. Drop foreign keys that reference the tables being removed.
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_organizationId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_projectId_fkey";
ALTER TABLE "CustomDomain" DROP CONSTRAINT "CustomDomain_projectId_fkey";
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_organizationId_fkey";
ALTER TABLE "OrganizationMember" DROP CONSTRAINT "OrganizationMember_userId_fkey";
ALTER TABLE "Project" DROP CONSTRAINT "Project_organizationId_fkey";
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_userId_fkey";

DROP INDEX "AuditLog_organizationId_createdAt_idx";
DROP INDEX "AuditLog_projectId_createdAt_idx";

-- 2. Drop the tenancy tables. These hold the only columns using "Role",
--    so the enum has no dependants afterwards.
DROP TABLE "CustomDomain";
DROP TABLE "ProjectMember";
DROP TABLE "Project";
DROP TABLE "OrganizationMember";
DROP TABLE "Organization";

-- 3. Replace the enums.
DROP TYPE "ComputeSize";
DROP TYPE "DomainStatus";
DROP TYPE "Plan";
DROP TYPE "ProjectStatus";

DROP TYPE "Role";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- 4. Reshape AuditLog: targets are now users rather than projects/orgs.
ALTER TABLE "AuditLog" DROP COLUMN "organizationId",
DROP COLUMN "projectId",
DROP COLUMN "targetId",
DROP COLUMN "targetRef",
DROP COLUMN "targetType",
ADD COLUMN     "targetUserId" TEXT;

-- 5. Users gain role, status, invite provenance and last-login tracking.
ALTER TABLE "User" ADD COLUMN     "invitedById" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';

-- 6. Indexes and foreign keys for the new shape.
CREATE INDEX "AuditLog_targetUserId_createdAt_idx" ON "AuditLog"("targetUserId", "createdAt" DESC);
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt" DESC);

ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. The pre-existing account becomes the admin, so the users table stays
--    reachable on databases that already had a user before this migration.
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "id" = (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1);
