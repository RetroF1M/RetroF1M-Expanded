# GitHub Repository Setup Instructions

## Overview
Create new repository "RetroF1M-Expanded" under your personal GitHub account to separate the expansion work from the original RetroF1M project.

## Step 1: Create New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `RetroF1M-Expanded`
3. Description: "Expanded RetroF1M with full grid support, variable calendars, and 16-bit points for 1950-2026 F1 archive"
4. Visibility: Public (or Private if you prefer)
5. **DO NOT** initialize with:
   - README (we have one)
   - .gitignore (we have one)
   - license (we'll keep original)
6. Click "Create repository"

## Step 2: Add New Remote to Local Repository

Run these commands in the local repository (`D:\OpenCode Projects\RETROF1M`):

```bash
# Add new remote
git remote add expanded https://github.com/YOUR_USERNAME/RetroF1M-Expanded.git

# Verify remotes
git remote -v
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Create and Switch to Main Branch

The current branch is `boundary-grid-calendar-z80`. We'll rename it to `main` for the new repo:

```bash
# Create main branch from current branch
git checkout -b main

# Push to new repository
git push -u expanded main
```

## Step 4: Create Branch Structure

### Create safe-original Branch
This will reference the original safe build:

```bash
# From safe-build-pit-toggle-points branch
git checkout safe-build-pit-toggle-points
git checkout -b safe-original
git push expanded safe-original

# Switch back to main
git checkout main
```

### Create development Branch
For active development work:

```bash
# From current boundary-grid-calendar-z80 work
git checkout -b development
git push expanded development

# Switch back to main
git checkout main
```

## Step 5: Update README for New Repository

The current README needs a small update to reference the new repository. I'll do this after the repo is created.

## Step 6: Branch Strategy Summary

- **main**: Latest stable expanded build (will become main after testing)
- **safe-original**: Protected reference to original safe build
- **development**: Active development (current boundary-grid-calendar-z80 work)
- **boundary-grid-calendar-z80**: Current working branch (will become development)

## Step 7: Original Repository (RetroF1M.github.io)

The original repository remains unchanged. The new `RetroF1M-Expanded` is a separate project that:
- References the original as a precursor
- Links back to it in the README
- Does not replace it

## After Setup

Once you've completed these steps, let me know and I will:
1. Update the README to reference the new repository
2. Add a section linking back to the original RetroF1M.github.io
3. Update progress-tracking.md with repository setup complete
4. Proceed to Phase 0.5 (baseline testing)

## Verification

After setup, verify with:

```bash
# Check all branches are pushed
git branch -a

# Check remotes
git remote -v

# Should show:
# origin  -> https://github.com/RetroF1M/RetroF1M.github.io.git
# expanded -> https://github.com/YOUR_USERNAME/RetroF1M-Expanded.git
```

## Notes

- The original `origin` remote remains intact
- We continue working in the local repository
- We push to both `origin` (original) and `expanded` (new) as needed
- The safe build branch is protected and never touched
