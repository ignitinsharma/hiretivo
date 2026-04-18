---
phase: 10-settings-restructure-auth-guards
plan: 02
status: complete
---

## Plan 02: Seeker Settings UI Rebuild

### What was built

**Seeker Settings Page:**
- Removed BillingSection import and usage
- Updated subtitle to remove "subscription" mention
- Renders: SettingsSidebar + PersonalInfoSection + PasswordSecuritySection + DangerZoneSection

**SettingsSidebar:**
- Removed Billing link (CreditCard icon)
- 3 links: Account, Password & Security, Danger Zone

**PersonalInfoSection (full rewrite):**
- Loads real data from /api/seeker/settings via useQuery
- All fields: name, email (read-only with "Verified" badge), headline, primaryRole, situation, availability, location, currency, salaryMin, salaryMax, bio
- Uses useForm + zodResolver + SeekerSettingsSchema
- useMutation for PATCH saves with query invalidation
- Skeleton loading states for all fields
- Initials-only avatar circle (no upload buttons)
- No hardcoded mock data

**PasswordSecuritySection (full rewrite):**
- Uses useForm + zodResolver + ChangePasswordSchema
- Calls /api/auth/change-password (PATCH)
- Handles "Current password is incorrect" with setError
- Removed 2FA toggle entirely
- Uses shadcn Input (no raw <input>)

**DangerZoneSection (rewrite):**
- Removed Export Data option
- Delete Account only, with AlertDialog type-to-confirm
- Calls POST /api/auth/delete-account
- Warning text does NOT mention subscription (seekers don't pay)

**BillingSection.tsx:**
- Deleted entirely (seekers don't pay, per D-05)

### Key Decisions
- Used same AlertDialog pattern as recruiter DeleteAccountSection
- Seeker warning text excludes subscription mention since seekers don't have subscriptions

### Deviations
- None
