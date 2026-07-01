# Link Prompt Library to Project Entry

## Goal

Allow users to pick a saved prompt from the prompt library when creating a project entry. The entry stores both a reference to the original prompt (FK) and an editable snapshot of the prompt text. This is Option C — FK + snapshot.

---

## What changes

### 1. Schema — `prisma/schema.prisma`

Add an optional `promptId` FK on `ProjectEntry` pointing to `Prompt`. The existing `promptText` field stays as the editable snapshot.

```prisma
model ProjectEntry {
  id         String         @id @default(cuid())
  notes      String?
  promptText String?        // editable snapshot of the prompt used
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
  projectId  String
  project    Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  images     ProjectImage[]

  // NEW: optional link back to the prompt library entry
  promptId   String?
  prompt     Prompt?        @relation(fields: [promptId], references: [id], onDelete: SetNull)

  @@index([projectId])
  @@index([createdAt])
  @@index([promptId])
}

model Prompt {
  // ... existing fields ...

  // NEW: back-relation
  projectEntries ProjectEntry[]
}
```

Migration: `npx prisma migrate dev --name add-prompt-link-to-entry`

---

### 2. New API route — `GET /api/prompts/library`

A lightweight endpoint that returns the current user's prompts (id, title, aiTool, promptText) for the picker modal. Reuses the existing `GET /api/prompts` route with `?limit=100` — no new route needed, just call with a small query.

> The existing `GET /api/prompts` already supports pagination and filtering. The picker will call it directly.

---

### 3. API — update entries POST route

`src/app/api/projects/[id]/entries/route.ts`

- Accept optional `promptId` in the request body alongside existing fields.
- Store it on the created `ProjectEntry`.
- Include `prompt { id, title, aiTool }` in the response `include`.

---

### 4. API — update entries GET route (and entryId route if exists)

- Include `prompt { id, title, aiTool }` in the `include` when returning entries, so the project detail page can show "sourced from: [prompt title]" badges.

---

### 5. New component — `PromptPickerModal`

`src/components/PromptPickerModal.tsx`

A modal that:
- Fetches `GET /api/prompts` (paginated, searchable by title)
- Renders a scrollable list of prompt cards (title, aiTool icon, truncated prompt text)
- On selection: calls `onSelect(prompt)` and closes
- Props: `isOpen`, `onClose`, `onSelect(prompt: { id, title, promptText, aiTool })`

---

### 6. UI — update new entry form

`src/app/projects/[id]/entries/new/page.tsx`

- Add state: `linkedPrompt: { id, title, promptText, aiTool } | null`
- Add a "Pick from library" button next to the Prompt Text field label
- When a prompt is selected via the modal:
  - Set `linkedPrompt`
  - Pre-fill `promptText` textarea with `prompt.promptText` (user can still edit it)
  - Show a dismissible pill/badge: "Sourced from: [prompt title]" with an × to unlink
- On unlink (×): clear `linkedPrompt`, keep the current textarea text as-is
- On submit: send `promptId: linkedPrompt?.id ?? null` along with the existing body

---

### 7. UI — show source prompt on project detail page

`src/app/projects/[id]/page.tsx`

- Update the `ProjectEntry` interface to include `prompt: { id, title, aiTool } | null`
- In each entry card, if `entry.prompt` exists, show a small linked badge:
  `"From library: [title]"` → links to `/prompts/[id]`

---

## File change summary

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `promptId` FK + back-relation on `Prompt` |
| `src/app/api/projects/[id]/entries/route.ts` | Accept + store `promptId`, include prompt in response |
| `src/app/api/projects/[id]/entries/[entryId]/route.ts` | Include prompt in GET response |
| `src/components/PromptPickerModal.tsx` | New modal component |
| `src/app/projects/[id]/entries/new/page.tsx` | Add picker button, linked prompt state, send promptId |
| `src/app/projects/[id]/page.tsx` | Show "From library" badge on entries that have a linked prompt |

---

## Implementation order

1. Schema change + migration
2. Update entries API (POST + GET) to handle `promptId`
3. Build `PromptPickerModal` component
4. Update new entry form page
5. Update project detail page to show the badge
