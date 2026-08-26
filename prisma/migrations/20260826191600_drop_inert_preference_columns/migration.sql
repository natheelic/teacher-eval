
-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "editEntitiesInCode",
DROP COLUMN "keyboardShortcuts",
DROP COLUMN "queueTableOperations",
DROP COLUMN "sidebarBehavior",
DROP COLUMN "telemetryEnabled";

-- DropEnum
DROP TYPE "SidebarBehavior";

