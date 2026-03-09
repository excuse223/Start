# Recommended Branch Protection Rules for `main`

## How to configure (Settings → Branches → Branch protection rules → Add rule)

### Branch name pattern: `main`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - Required checks: `Backend (Python 3.11)`, `Frontend (Node 18)`
- [x] Require conversation resolution before merging
- [x] Do not allow bypassing the above settings
- [ ] Require signed commits (optional)
- [x] Require linear history (recommended)
