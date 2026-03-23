

# Replace Google/Apple Auth with Telegram Login

## Overview

Remove Google and Apple OAuth buttons from both auth pages (`Auth.tsx` and `EmployeeAuth.tsx`) and replace them with Telegram Login. Since Telegram is not a standard OAuth provider supported by Lovable Cloud, this requires a custom flow using the Telegram Login Widget and a backend edge function for verification.

## How Telegram Login Works

```text
User clicks "Login with Telegram"
  → Telegram Login Widget opens (popup)
  → User authorizes via their Telegram app
  → Widget returns: { id, first_name, last_name, username, photo_url, auth_date, hash }
  → Frontend sends this data to edge function
  → Edge function verifies hash using bot token (HMAC-SHA256)
  → Edge function creates or finds user in auth system
  → Edge function returns a session (access_token + refresh_token)
  → Frontend sets the session → user is logged in
```

## Prerequisites

- **Telegram Bot Token**: You need a bot created via [@BotFather](https://t.me/BotFather). The bot token will be stored as a secret (`TELEGRAM_BOT_TOKEN`).
- **Telegram connector**: We'll connect the Telegram connector for gateway access and also store the bot token as a separate secret for hash verification.

## Implementation Steps

### Step 1: Add `TELEGRAM_BOT_TOKEN` secret
Store the bot token from BotFather for server-side hash verification.

### Step 2: Create `telegram-auth` edge function
New file: `supabase/functions/telegram-auth/index.ts`

- Accepts POST with Telegram Login Widget payload (`id`, `first_name`, `last_name`, `username`, `photo_url`, `auth_date`, `hash`)
- Verifies the `hash` using HMAC-SHA256 with the bot token (per [Telegram docs](https://core.telegram.org/widgets/login#checking-authorization))
- Checks `auth_date` is not stale (reject if > 5 minutes old)
- Uses Supabase service role to:
  - Look up existing user by `telegram_id` in profiles table
  - If not found: create a new auth user with a deterministic email (`tg_<telegram_id>@telegram.user`) and random password, then create profile
  - If found: retrieve the user
  - Generate a session using `admin.generateLink` or sign in programmatically
- Returns `{ access_token, refresh_token }` to the frontend

### Step 3: Add `telegram_id` column to profiles table
Database migration to add `telegram_id bigint` column to the `profiles` table for linking Telegram accounts to users.

### Step 4: Create `TelegramLoginButton` component
New file: `src/components/auth/TelegramLoginButton.tsx`

- Loads the Telegram Login Widget script (`https://telegram.org/js/telegram-widget.js`)
- Renders an invisible container; on callback receives user data
- Calls the `telegram-auth` edge function with the payload
- On success, calls `supabase.auth.setSession()` with the returned tokens
- Shows loading state during verification

### Step 5: Update `Auth.tsx`
- Remove the `lovable` import and `handleGoogleLogin` function
- Remove Google and Apple OAuth buttons
- Add `<TelegramLoginButton />` in their place
- Keep email/password form below for agencies that prefer it

### Step 6: Update `EmployeeAuth.tsx`
- Remove Google and Apple OAuth buttons and related state (`googleLoading`)
- Remove `lovable` import
- Add `<TelegramLoginButton />` in their place
- Keep email/password form below

## Technical Details

**Hash verification (edge function)**:
```text
data_check_string = sorted key=value pairs joined by \n (excluding hash)
secret_key = SHA256(bot_token)
computed_hash = HMAC-SHA256(data_check_string, secret_key)
valid = computed_hash === received_hash
```

**User creation strategy**: Uses a synthetic email (`tg_<id>@telegram.user`) so Supabase auth can manage the user. The real identity is tracked via `telegram_id` on the profiles table. The `handle_new_user` trigger will auto-create the profile; the edge function then patches it with `telegram_id`.

**Files modified**:
- `src/pages/Auth.tsx` — remove Google/Apple, add Telegram button
- `src/pages/EmployeeAuth.tsx` — remove Google/Apple, add Telegram button
- `src/components/auth/TelegramLoginButton.tsx` — new component
- `supabase/functions/telegram-auth/index.ts` — new edge function
- Database migration: add `telegram_id` to profiles

