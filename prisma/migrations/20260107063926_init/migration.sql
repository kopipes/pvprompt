-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "aiTool" TEXT NOT NULL,
    "promptText" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "modelVersion" TEXT,
    "aspectRatio" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "mediaUrl" TEXT,
    "mediaFile" TEXT,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PromptCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PromptCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromptCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Prompt_aiTool_idx" ON "Prompt"("aiTool");

-- CreateIndex
CREATE INDEX "Prompt_mediaType_idx" ON "Prompt"("mediaType");

-- CreateIndex
CREATE INDEX "Prompt_createdAt_idx" ON "Prompt"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_PromptCategories_AB_unique" ON "_PromptCategories"("A", "B");

-- CreateIndex
CREATE INDEX "_PromptCategories_B_index" ON "_PromptCategories"("B");
