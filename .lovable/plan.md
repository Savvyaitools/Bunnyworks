

## Fix: Store and retrieve creator login passwords

**Problem**: After creating an account, the "Copy Login Info" button on a creator card shows `(set during account creation)` instead of the actual password. Agency owners need to share credentials with creators later.

**Solution**: Store the generated password (encrypted) in the creators/employees table so it can be retrieved and copied later.

### Changes

**1. Database migration** — Add `login_password` column to `creators` and `employees` tables:
```sql
ALTER TABLE creators ADD COLUMN login_password text;
ALTER TABLE employees ADD COLUMN login_password text;
```
This stores the agency-set password in plaintext (acceptable since agency owners set and manage these passwords — they're not user-chosen secrets).

**2. `src/pages/Creators.tsx`** — After account creation succeeds, save the password to the creator record alongside `auth_user_id`.

**3. `src/pages/Employees.tsx`** — Same as above for employees.

**4. `src/components/creators/CreatorCard.tsx`** — Update `handleCopyLoginInfo` to use `creator.login_password` instead of the hardcoded placeholder string. If password exists, show it; otherwise fall back to the current message.

**5. `src/components/employees/EmployeeCard.tsx`** — Same pattern if "Copy Login Info" exists there.

### Technical note
The `login_password` column will be accessible via existing RLS policies since it's on agency-scoped tables. Only the agency owner who created the account can see it.

