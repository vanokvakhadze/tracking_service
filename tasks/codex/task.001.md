# task.001 — Cleanup empty `tracking_service/` folder

**Type:** 🤖 Codex
**Depends on:** none
**Commit:** `chore: remove empty tracking_service folder`

---

## Read first
`tasks/00_AI_AGENT_RULES.md`

## Goal
Remove the leftover empty folder `tracking_service/` from the repo root. It is empty and unused.

## Steps

```powershell
# From repo root: c:\Users\Zaza\Desktop\trackingService
Remove-Item -Recurse -Force tracking_service
```

## Acceptance criteria
- [ ] `tracking_service/` no longer exists at repo root
- [ ] `git status` shows no other changes besides this deletion (if it was tracked)

## Commit

```powershell
# Only if the folder was tracked by git:
git add -A tracking_service
git commit -m "chore: remove empty tracking_service folder"
```

If `git status` is already clean (folder was never tracked), no commit needed — just proceed to task.002.

## DO NOT
- ❌ Touch any other files
- ❌ Create the monorepo files yet (next task)
