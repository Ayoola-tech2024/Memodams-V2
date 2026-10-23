# Security Specification for MemoDams Vault

## 1. Data Invariants
1. **User Identity Invariant**: All notes and media documents must have `userId == request.auth.uid`. A user can never read, list, create, update, or delete records belonging to another user.
2. **User Profile Invariant**: Users may only access and update `/users/{userId}` where `userId == request.auth.uid`.
3. **Immutability of Key Identity**: The `userId` and `id` properties cannot be modified after document creation (`incoming().userId == existing().userId`).
4. **Boundary Limits**: String lengths, tag arrays, and data payloads must strictly abide by size bounds.
5. **No Blind Query Scraping**: `allow list` mandates `resource.data.userId == request.auth.uid` so cross-tenant queries return `PERMISSION_DENIED`.

## 2. The Dirty Dozen Payloads (Designed to break security rules)
1. **Anonymous / Unauthenticated Create**: An unauthenticated request attempts to create a note. Expected: PERMISSION_DENIED.
2. **ID Spoofing Create**: User A creates a note with `userId = "UserB"`. Expected: PERMISSION_DENIED.
3. **Cross-Tenant Document Read**: User A attempts to `get` `/notes/{noteOfUserB}`. Expected: PERMISSION_DENIED.
4. **Cross-Tenant Document Update**: User A attempts to overwrite `title` of `/notes/{noteOfUserB}`. Expected: PERMISSION_DENIED.
5. **Cross-Tenant Document Delete**: User A attempts to delete `/notes/{noteOfUserB}`. Expected: PERMISSION_DENIED.
6. **Cross-Tenant List Scraping**: User A attempts `collection('notes')` query without restricting to `userId == UserA`. Expected: PERMISSION_DENIED.
7. **Identity Mutation Update**: User A tries to modify `userId` from `"UserA"` to `"UserB"` in an existing note. Expected: PERMISSION_DENIED.
8. **Ghost Field Injection**: User A adds unauthorized field `isAdmin: true` into a note payload. Expected: PERMISSION_DENIED.
9. **Media Cross-Tenant Read**: User A tries to view a private video vault entry belonging to User B. Expected: PERMISSION_DENIED.
10. **Media Path Variable Tampering**: An invalid document ID string with special injection characters is used. Expected: PERMISSION_DENIED.
11. **User Profile Hijacking**: User A writes to `/users/{UserB_uid}`. Expected: PERMISSION_DENIED.
12. **Denial of Wallet Payload**: Attacker submits an excessive tag list size or invalid types. Expected: PERMISSION_DENIED.
