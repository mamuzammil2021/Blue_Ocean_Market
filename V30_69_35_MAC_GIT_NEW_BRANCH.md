# V30.69.35 — safe Git branch workflow

The delivered ZIP is complete source, without dependencies, secrets, live database, uploads or Git metadata. The development branch used here is `feature/v30.69.35-packaging-completion`. Nothing was pushed or merged.

In Terminal, enter your existing Blue Ocean repository. Check its state:

```bash
git status --short --branch
```

If there are unrelated changes, commit them on their own branch or use a separate checkout. Do not discard them. On a clean checkout:

```bash
git switch main
git pull --ff-only
git switch -c feature/v30.69.35-packaging-completion
```

This delivery extends the supplied .33 protected source through the delivered .34 engineering candidate. If current `main` includes newer or unrelated work, compare and reconcile that work before copying. Do not overwrite a newer main with this ZIP.

Extract the ZIP outside the repository. Replace the example absolute paths below with your actual locations. Preview the copy first:

```bash
rsync -avn --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='data' --exclude='uploads' --exclude='backups' /absolute/path/Blue_Ocean_Market_V30_69_35/ /absolute/path/your-repository/
```

Then copy with the same exclusions, without `--delete`:

```bash
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='data' --exclude='uploads' --exclude='backups' /absolute/path/Blue_Ocean_Market_V30_69_35/ /absolute/path/your-repository/
npm ci
git diff --check
git status --short
```

Use the disposable test environment described in the implementation report. Do not point test fixtures at production. Back up and migrate staging with the commands in `docs/releases/v30.69.35/DEPLOYMENT_AND_ACCEPTANCE.md`.

After reviewing the diff and test results:

```bash
git add package.json package-lock.json server public scripts qa docs CHANGELOG.md V30_69_35_IMPLEMENTATION_AND_QA.md V30_69_35_MAC_GIT_NEW_BRANCH.md
git diff --cached --stat
git commit -m "Complete controlled packaging workflows and settlement integration"
git push -u origin feature/v30.69.35-packaging-completion
```

Review the staged file list before committing. It must not contain environment secrets, runtime databases, uploads, dependencies or backups. Open a pull request targeting main and complete staging acceptance. Do not push directly to main.
