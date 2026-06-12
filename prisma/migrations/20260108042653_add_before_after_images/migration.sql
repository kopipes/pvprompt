/*
  Warnings:

  - You are about to drop the column `mediaFile` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `mediaType` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `mediaUrl` on the `Prompt` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "modelVersion" TEXT,
    "aspectRatio" TEXT,
    "beforeImage" TEXT,
    "afterImage" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Prompt" ("aiTool", "aspectRatio", "createdAt", "id", "modelVersion", "negativePrompt", "promptText", "settings", "title", "updatedAt", "userId") SELECT "aiTool", "aspectRatio", "createdAt", "id", "modelVersion", "negativePrompt", "promptText", "settings", "title", "updatedAt", "userId" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE INDEX "Prompt_aiTool_idx" ON "Prompt"("aiTool");
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
