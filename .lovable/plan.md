

# Wire Up stagehand-helpers.ts Into Batch Reply Workflow

## Problem
The `batch_reply` action in `browserbase-session/index.ts` (lines 2390–2624) uses crude inline CDP scripts that:
1. **Click the `<a>` profile link** instead of the chat row body (line 2459: `target.querySelector('a') || target`)
2. **Ignore 1,186 lines of hardened helpers** in `stagehand-helpers.ts` that already fix this exact issue
3. Use fixed delays instead of humanized timing
4. Have fewer send-button selectors and no fallback strategies

## Solution
Replace ~170 lines of inline CDP scripts with imports from the existing `stagehand-helpers.ts` module. Zero new logic needed — just wire up what's already built.

## Changes — Single File

**`supabase/functions/browserbase-session/index.ts`**

### 1. Add import (top of file, after existing imports)
```typescript
import {
  clickConversationViaCDP,
  injectChatReplyViaCDP,
} from "../_shared/stagehand-helpers.ts";
```

### 2. Replace inline click script (lines 2454–2462)
Before:
```javascript
var clickTarget = target.querySelector('a') || target;  // BUG: clicks profile link
```
After:
```typescript
const clickRes = await clickConversationViaCDP(BK, bbSid, conv.fanName, conv.index);
```
This uses the hardened helper that explicitly avoids `<a>` tags and targets the message preview area instead.

### 3. Replace inline inject script (lines 2544–2574)
Before: 30-line inline script with 3 send-button selectors
After:
```typescript
const injectRes = await injectChatReplyViaCDP(BK, bbSid, replyText);
```
This uses the robust helper with 12+ send-button selectors, form submit fallback, and Enter key fallback.

### 4. Replace fixed delays with humanized timing
Before: `setTimeout(r, 2000 + Math.random() * 2000)` (fixed 2-4s)
After: Import and use the delay functions from stagehand-helpers (they're not exported, so add inline equivalents):
- After clicking conversation: 3-6s random wait (reading pause)
- After sending reply: 5-10s random wait before navigating back
- Between conversations: 4-8s random wait

### 5. Deploy
Redeploy `browserbase-session` edge function.

## Net Impact
- **~140 lines removed** (inline scripts)
- **~25 lines added** (imports + helper calls + humanized delays)
- The profile-link click bug is fixed
- Send reliability improves (3 selectors → 12+)
- Timing becomes human-like and randomized

