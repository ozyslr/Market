#!/usr/bin/env bash
# Pre-commit secret scanner — blocks commits containing API keys / tokens.
set -euo pipefail

RED='\033[0;31m'
NC='\033[0m'

# Patterns that indicate secrets (never block for placeholder values)
PATTERNS=(
  'sk_live_[a-zA-Z0-9]{20,}'
  'pk_live_[a-zA-Z0-9]{20,}'
  'ghp_[a-zA-Z0-9]{36}'
  'AKIA[A-Z0-9]{16}'
  'xox[baprs]-[a-zA-Z0-9-]+'
  '-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY'
  'ya29\.[a-zA-Z0-9_-]{50,}'           # Google OAuth tokens
  'AIza[0-9A-Za-z_-]{35}'               # Google API keys in source (allow in .env)
)

FOUND=0
for PATTERN in "${PATTERNS[@]}"; do
  # Only scan staged files (not the working tree)
  MATCHES=$(git diff --cached --name-only -z 2>/dev/null | xargs -0 grep -nE "$PATTERN" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    # Allow patterns in .env files and .env.example (they're expected there)
    REAL_MATCHES=$(echo "$MATCHES" | grep -v '\.env' || true)
    if [ -n "$REAL_MATCHES" ]; then
      echo -e "${RED}[SECURITY] Secret pattern detected:${NC} $PATTERN"
      echo "$REAL_MATCHES"
      FOUND=1
    fi
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo -e "${RED}Commit blocked: potential secrets detected.${NC}"
  echo "If these are false positives, use 'git commit --no-verify' to bypass."
  exit 1
fi

exit 0
