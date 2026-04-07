

# Fix Creator Onboarding Form — Data Mapping & Login URL Issues

## Issues Found

### 1. Login URL Points to Wrong Route
Both `CreatorCard.tsx` (line 48) and `AccountCreationDialog.tsx` (line 59) use `/auth` as the login URL. But `/auth` is for **agency owners**. Creators should be directed to `/customer-portal` (the Creator Portal). The URL correctly uses `window.location.origin` which resolves to `bunnyworks.io` on the custom domain — that part is fine.

### 2. Form Data Dropped on Submit
The `handleSubmit` in `Creators.tsx` (lines 42-64) **hardcodes most fields to null** even though the form collects them. These fields are lost:
- `alias` → hardcoded `null` (should use `data.alias`)
- `phone` → hardcoded `null` (should use `data.phone`)
- `notes` → hardcoded `null` (should use `data.notes`)
- `onlyfans_url`, `instagram_url`, `twitter_url`, `tiktok_url` → all `null`
- All questionnaire fields (`location`, `occupation`, `hair_color`, `eye_color`, `body_type`, `height`, `weight`, `bra_size`, `favorite_food`, `favorite_music`, `character_traits`, `hobbies`, `niche`, `creator_references`, `content_types`, `fetish_content`, `favorite_position`, `turn_ons`, `attracted_to`, `boundaries`, and all boolean toggles) → completely missing from the submit payload

The database **does have columns** for all these fields, so they just need to be passed through.

### 3. Persona Not Displayed on Creator Card
The `CreatorCard` component never renders `creator.persona`. The data is saved to the DB but invisible on the card.

## Plan

### Step 1: Fix Login URLs
- `CreatorCard.tsx` line 48: Change `/auth` to `/customer-portal`
- `AccountCreationDialog.tsx` line 59: Use `/customer-portal` when `userType === "creator"`, keep `/auth` for employees

### Step 2: Pass All Form Fields Through on Submit
Update `handleSubmit` in `Creators.tsx` to map every form field to the `createCreator` call:
- `alias`, `phone`, `notes`, social URLs from form data
- All questionnaire fields: appearance, personality, content preferences, boundaries, boolean toggles
- Array fields (`character_traits`, `niche`, `content_types`, `fetish_content`) need comma-split into arrays since the DB stores them as `TEXT[]`

### Step 3: Show Persona on Creator Card
Add a persona snippet below the creator name/alias section in `CreatorCard.tsx`. Display it as a truncated italic line (e.g., first 60 chars) so it's visible at a glance.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Creators.tsx` | Map all form fields to `createCreator` payload |
| `src/components/creators/CreatorCard.tsx` | Fix login URL to `/customer-portal`, display persona |
| `src/components/shared/AccountCreationDialog.tsx` | Fix login URL based on `userType` |

