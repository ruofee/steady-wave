---
name: git-commit-convention
description: Generate concise Git commit messages following commitlint convention. Use when the user asks to commit changes, mentions "提交代码" or "submit code", or needs help writing commit messages.
---

# Git Commit Convention

## Commit Message Format

Follow the commitlint convention with this structure:

```
<type>(<scope>): <subject>
```

### Rules

1. **Keep it short**: Subject line should be ≤50 characters
2. **No period**: Don't end the subject with a period
3. **Imperative mood**: Use "add" not "added" or "adds"
4. **Lowercase**: Keep subject in lowercase

### Types

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, no logic change) |
| `refactor` | Code refactoring (no feature change or bug fix) |
| `perf` | Performance improvements |
| `test` | Add or update tests |
| `chore` | Build process, dependencies, tooling |

### Scope (Optional)

Use scope to specify the affected area:
- `feat(auth)`: login system
- `fix(api)`: endpoint issues
- `style(ui)`: UI components

**Omit scope if the change affects multiple areas.**

### Examples

```bash
# Good ✅
feat: add user authentication
fix(api): correct date formatting
refactor: simplify request module
chore: update dependencies

# Bad ❌
feat: Added a new feature for user authentication (too long)
Fix API bug. (capitalized, has period)
update (missing type)
feat: adds login (wrong mood)
```

## Workflow

When the user asks to commit:

1. Run `git diff` to view changes
2. Analyze the changes to understand the intent
3. Generate a concise commit message following the format
4. Execute: `git add . && git commit -m "your message"`
5. Confirm the commit was successful

## Additional Guidelines

- **Multiple changes**: If changes span multiple types, use the most prominent type
- **Breaking changes**: Add `!` after type: `feat!: change API response format`
- **Focus on "why"**: Subject should express intent, not implementation details
  - ✅ `fix: prevent memory leak on logout`
  - ❌ `fix: change variable from let to const`
