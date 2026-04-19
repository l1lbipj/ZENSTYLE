# Testing Guide - Appointment Booking & Product Orders

## Prerequisites
- Backend running: `php artisan serve`
- Frontend running: `npm run dev`
- User authenticated as client

## Test Appointment Booking Flow

### Step 1: Navigate to Book Appointment
1. Go to `/client/book`
2. Should load services and staff from API
3. If loading fails, notification appears

### Step 2: Fill Appointment Form
1. Select a service
2. Select staff member
3. Choose future date
4. Choose time
5. Click "Book appointment"

### Expected Results
✅ Loading spinner shows while submitting
✅ Success toast appears: "Appointment #123 booked successfully!"
✅ Form stays open with success message
✅ Appointment appears in /client/activities

### Error Scenarios
- **Missing fields**: Form validation prevents submission
- **Past date**: Validation prevents submission
- **Staff conflict**: Backend error shown as notification
- **Server error**: Generic error notification with retry

## Test Product Order Flow

### Step 1: Add Products to Cart
1. Go to `/products`
2. Add multiple products
3. Adjust quantities
4. Go to `/cart`

### Step 2: Apply Promo Code
1. Select promo from dropdown (ZENSTYLE10 or ZENSTYLE20)
2. Click "Apply"
3. Should see success toast: "Applied: ZENSTYLE10 — 10% off."
4. Discount calculated in summary

### Step 3: Checkout
1. Click "Proceed to checkout"
2. Modal opens with checkout form
3. Fill all required fields:
   - Name
   - Phone
   - Address
   - (Optional) Note

### Expected Results
✅ Loading spinner while submitting
✅ Success toast: "Order #456 placed successfully! Total: $XX.XX"
✅ Order appears in /client/activities
✅ Cart clears automatically
✅ Modal closes

### Error Scenarios
- **Missing shipping**: Notification "Please fill name, phone, and address"
- **Stock unavailable**: Backend error "Insufficient stock..."
- **Invalid promo**: Backend error message
- **Server error**: Notification with error details

## Test Unified Activity Dashboard

### Navigate to Activities
1. Click "All activities" from client menu
2. Or go to `/client/activities`

### Verify Display
✅ Shows statistics:
  - Upcoming appointments count
  - Product orders count
  - Total spending
✅ Shows recent activities (up to 6)
✅ Shows both appointments and orders together
✅ Chronologically ordered (newest first)

### Test Reschedule Appointment
1. From activities, find upcoming appointment
2. Enter new date/time in form
3. Click "Reschedule"
4. Toast shows: "Appointment rescheduled successfully."
5. Activity updates

### Test Cancel Appointment
1. Find upcoming appointment
2. Click "Cancel"
3. Toast shows: "Appointment cancelled successfully."
4. Activity status changes to "Completed / Closed"

### Test View Order Details
1. Find recent order
2. Click "View details"
3. Should navigate to order page (if implemented)

## Toast Notification Testing

### Success Notifications
- Appointment booking: Green, shows appointment ID
- Checkout: Green, shows order ID and total
- Promo applied: Green, shows promo details
- Reschedule: Green, generic success message
- Cancel: Green, generic success message

### Error Notifications
- Form validation: Red, specific field message
- Server errors: Red, server message
- Network errors: Red, generic message

### Info Notifications
- Promo removed: Blue
- Empty cart warning: Yellow

## Performance & UX Checks

✅ Notifications appear and disappear automatically
✅ Toast doesn't block form interaction
✅ Loading states prevent double-submit
✅ Errors clear when retrying
✅ Success shows order/appointment ID for reference
✅ All forms disable submit during loading

## API Response Verification

### Successful Appointment
```json
{
  "success": true,
  "message": "Appointment booked successfully.",
  "data": {
    "appointment_id": 123,
    "status": "active",
    "appointment_date": "2026-04-19T...",
    ...
  }
}
```

### Successful Order
```json
{
  "success": true,
  "message": "Checkout successful.",
  "data": {
    "shop_order_id": 456,
    "total_amount": "59.99",
    "status": "pending",
    ...
  }
}
```

## Common Issues & Solutions

### Problem: Toast doesn't show
- **Solution**: Check if Ant Design message component is imported
- **Location**: `useNotification.js` hook

### Problem: Activities page shows empty
- **Solution**: Check API endpoints exist
  - `businessApi.appointments()`
  - `businessApi.myShopOrders()`

### Problem: Notification duplicates
- **Solution**: Check callback dependency in handleSubmit
- **Fix**: Ensure `[notify]` dependency in useCallback

### Problem: Page doesn't load data
- **Solution**: Verify authentication token is sent
- **Check**: Network tab for authorization header

## Database State Verification

### After Booking Appointment
```sql
SELECT * FROM appointments WHERE appointment_id = 123;
SELECT * FROM appointment_details WHERE appointment_id = 123;
```

### After Placing Order
```sql
SELECT * FROM shop_orders WHERE shop_order_id = 456;
SELECT * FROM shop_order_items WHERE shop_order_id = 456;
-- Stock should be decremented
SELECT stock_quantity FROM products WHERE product_id = ...;
```

## Cleanup for Testing

### Reset Test Data
```bash
# Truncate test orders and appointments
php artisan tinker
>>> ShopOrder::truncate()
>>> ShopOrderItem::truncate()
>>> Appointment::truncate()
>>> AppointmentDetail::truncate()
```

## Success Criteria ✅

All tests pass when:
1. ✅ Appointments book with success notification
2. ✅ Orders create with success notification
3. ✅ Activities page shows both combined
4. ✅ Reschedule/cancel work with notifications
5. ✅ Error messages display for failures
6. ✅ Forms prevent double-submission
7. ✅ Inventory is properly managed
8. ✅ Promo codes apply correctly
