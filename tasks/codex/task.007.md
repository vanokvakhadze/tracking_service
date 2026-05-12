# task.007 — GitHub repo + branch protection

**Type:** 👤 Manual (user does via GitHub UI / `gh` CLI)
**Depends on:** task.006
**Commit:** N/A

---

## Goal
Push the local repo to a new private GitHub repo, create the `develop` branch, protect `main`.

---

## Steps

### 1. Create the repo

Option A — browser:
1. https://github.com/new
2. Name: `trackpro`
3. Visibility: **Private**
4. **Do not** add README / .gitignore / license — we already have these.
5. Create → copy the SSH URL.

Option B — `gh` CLI:
```powershell
gh repo create trackpro --private --source=. --remote=origin --push=false
```

### 2. Push `main` and create `develop`
```powershell
git remote add origin git@github.com:<your-username>/trackpro.git
git branch -M main
git push -u origin main

git checkout -b develop
git push -u origin develop
git checkout main
```

### 3. Protect `main`

GitHub → repo Settings → Branches → "Add branch ruleset" for `main`:
- ✅ Require a pull request before merging
- ✅ Require conversation resolution before merging
- ❌ Disallow force pushes
- ❌ Disallow deletions

(Leave required status checks empty for now — task.033 will add the CI check.)

## Acceptance criteria
- [ ] `https://github.com/<your-username>/trackpro` is reachable (private)
- [ ] Both `main` and `develop` branches exist on the remote
- [ ] `main` is protected (force-push disabled)
- [ ] `git remote -v` shows `origin` pointing to GitHub
