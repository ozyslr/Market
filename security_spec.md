# Mercora Firestore Security Specification

## 1. Data Invariants
- A product cannot be created without a valid seller ID.
- A user can only edit their own profile.
- Only admins or the seller themselves can edit seller store details.
- Only the buyer of an order or an admin/moderator can view order details.
- Reviews must be linked to a product and a user.

## 2. The "Dirty Dozen" Payloads (Denial Expected)

1. **Identity Spoofing**: Logged in as `userA`, attempting to write to `users/userB`.
2. **Role Escalation**: Buyer attempting to update their role to `admin`.
3. **Ghost Fields**: Creating a product with an extra field `isApproved: true` when it's not in schema.
4. **Price Poisoning**: Seller updating a product price to a string `"free"`.
5. **Orphaned Review**: Creating a review for a non-existent product.
6. **Stock Manipulation**: Buyer attempting to update a product's stock directly.
7. **Temporal Fraud**: Creating an order with `createdAt` set to 2010.
8. **Malicious ID**: Creating a user with ID `../../../etc/passwd`.
9. **Resource Exhaustion**: Sending a 2MB string in the `description` field.
10. **Seller KYC Bypass**: Seller attempting to update their `kycStatus` to `verified`.
11. **PII Leak**: Authenticated user attempting to list ALL users' private emails.
12. **Status Shortcut**: Buyer updating an order status from `pending` directly to `delivered`.

## 3. Test Runner Concept
The `firestore.rules` will implement `isValidUser`, `isValidProduct`, etc., to verify schema and identity. All the above payloads will be rejected via these rules.
