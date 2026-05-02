I found the likely cause: the reference media upload flow is still inconsistent with the newer agency-scoped storage security rules.

The current UI uploads to:

```text
{agencyId}/{creatorId}/{planId}/file.ext
```

but there are duplicate/older storage policies still present for `content-references`, including broad agency-only policies and newer folder-scoped policies. The app also sometimes calls `uploadMedia()` without passing the already-known `agencyId`, forcing it to re-resolve agency context during upload. If that context is not ready, stale, or the policy path check is stricter than the client path, the upload silently fails or appears stuck.

Plan to fix:

1. Clean up `content-references` storage policies
   - Remove duplicate old policies for `content-references`.
   - Keep a single strict set of policies for SELECT / INSERT / DELETE.
   - Require the first path folder to match the logged-in user’s agency ID.
   - Use `authenticated` role instead of public role for private bucket operations.
   - Preserve multi-tenant isolation: no cross-agency file access.

2. Fix the frontend upload calls
   - Pass `agencyId` directly from `CreatorContentPlans` into every `uploadMedia()` call.
   - Block upload immediately if agency context is missing instead of starting an upload spinner.
   - Add clear upload error toasts when file upload or plan media save fails.

3. Make upload state reliable for multiple files
   - Ensure the upload spinner resets after all selected files finish.
   - Avoid calling `updatePlanMedia()` if every file failed.
   - Keep the selected plan/media dialog in sync after successful uploads.

4. Improve file path/delete handling
   - Prefer the stored `path` field for deletes instead of parsing the signed URL.
   - Keep URL parsing as a fallback for older records.

5. Verify the fix
   - Check database storage policies after migration.
   - Verify the bucket remains private.
   - Test the create-card upload flow and existing-card media dialog flow.
   - Confirm failed uploads show a useful error instead of getting stuck.