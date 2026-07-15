# LifeSim CSS split patch

Run from the repository root after extracting this patch:

```powershell
.\split-styles.cmd
```

The command reads the current `src/styles.css`, splits it without reordering the cascade, verifies the generated structure, then runs the existing project checks.
