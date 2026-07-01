-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notes" TEXT,
    "promptText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "promptId" TEXT,
    CONSTRAINT "ProjectEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectEntry_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ProjectEntry" ("createdAt", "id", "notes", "projectId", "promptText", "updatedAt") SELECT "createdAt", "id", "notes", "projectId", "promptText", "updatedAt" FROM "ProjectEntry";
DROP TABLE "ProjectEntry";
ALTER TABLE "new_ProjectEntry" RENAME TO "ProjectEntry";
CREATE INDEX "ProjectEntry_projectId_idx" ON "ProjectEntry"("projectId");
CREATE INDEX "ProjectEntry_createdAt_idx" ON "ProjectEntry"("createdAt");
CREATE INDEX "ProjectEntry_promptId_idx" ON "ProjectEntry"("promptId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
