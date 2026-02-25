

# Earnings Scraper — Verified & Improved

## Status: ✅ Deployed & Tested

## Changes Made (Feb 25, 2026)

### 1. Target URL Updated
- Changed from `/my/statistics` → `/my/statistics/statements/earnings` for detailed breakdown

### 2. Polling Loop Extended
- Increased from 7 attempts (10.5s) → 10 attempts (15s)
- Added keyword detection (`subscriptions`, `tips`, `messages`) alongside `$` regex
- Now captures 8000 chars instead of 5000

### 3. Regex Patterns Overhauled
- **Newline-separated**: `Label\n$1,234.56` (primary OF DOM format)
- **Inline**: `Label: $1,234.56` or `Label $1,234.56` (fallback)
- Added `posts` category parsing
- Added fallback: finds largest `$` amount on page if no labels match

### 4. Enhanced Logging
- Logs first 800 chars of raw DOM text for debugging
- Logs all parsed values before DB upsert
- Logs fallback amount detection

### 5. Tests
- 6 parser tests covering all formats (newline, inline, spacing, fallback, empty page)
- All passing ✅

## To Verify End-to-End
1. Launch admin session for Weems from Browser page
2. Log in if needed (should auto-restore from context)
3. Click "Save Login & Close"
4. Check edge function logs for `Earnings poll attempt` and `Earnings raw DOM text`
5. Verify `creator_earnings` table updates with new values
