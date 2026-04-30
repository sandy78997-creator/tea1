1. **Data Invariants**:
   - A menu item must have a positive price.
   - Menu items can only be created, updated, or deleted by an admin.
   - An order must belong to a signed-in user.
   - An order's total amount must be positive.
   - A newly created order must have a 'pending' status.
   - An order's total amount must match the sum of its items (this is evaluated by checking structure, though Firestore rules can't deeply evaluate arrays easily, we'll enforce type bounds).
   - Only admins can update the status of an order to 'preparing' or 'completed'.
   - Users can only read their own orders, unless they are an admin.
   - `userRoles` modification is restricted: users cannot change their own roles.

2. **The "Dirty Dozen" Payloads**:
   1. *Spoofed Admin Role*: `{ "role": "admin" }` sent to `userRoles/{myId}` by a customer.
   2. *Negative Price Item*: `{ "name": "Test", "price": -10, "category": "Tea", "isAvailable": true }` to `menuItems/{id}` by Admin.
   3. *Customer creating MenuItem*: `{ "name": "Fake Tea", "price": 10, "category": "Tea", "isAvailable": true }` to `menuItems/{id}` by Customer.
   4. *Orphaned Order*: `{ "userId": "someone_else_id", "status": "pending", "items": [], "totalAmount": 0 }` to `orders/{id}` by Customer.
   5. *Skipping Pending State*: `{ "userId": "my_id", "status": "completed", "items": [{"name": "Tea", "price": 50, "quantity": 1}], "totalAmount": 50, "createdAt": "now", "updatedAt": "now" }` to `orders/{id}` by Customer.
   6. *Shadow Field in Order*: `{ "userId": "my_id", "status": "pending", "items": [], "totalAmount": 10, "createdAt": "now", "updatedAt": "now", "discountApplied": true }` to `orders/{id}` by Customer.
   7. *Admin ID Poisoning*: Updating an order placing 1MB string in userId.
   8. *Denial of Wallet*: Sending an order with 2000 items in the `items` array.
   9. *Modifying Immutable CreatedAt*: Updating `createdAt` of an existing order.
   10. *Stealing Order*: Customer A fetching `orders/{id_of_customer_b}`.
   11. *Terminal State Violation*: Modifying an order that is already 'completed' or 'cancelled'.
   12. *Customer Cancelling Completed Order*: Customer changing status from 'completed' to 'cancelled'.

3. **The Test Runner**:
   Defined in `firestore.rules.test.ts`.
