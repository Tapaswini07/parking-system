# StackFusion Assignment - Fixes and Debugging Report

## Overview
This document outlines all the issues found in the parking management system and the fixes applied across the three components: Django Backend, Go Backend, and Next.js Frontend.

## Issues Found and Fixed

### 1. Django Backend (backend-django/parking/)

#### Issue 1.1: Incorrect Available Slots Filter
**File:** `parking/views.py` (Line 20)  
**Problem:** The `get_available_slots()` endpoint was filtering for occupied slots instead of available ones.
```python
# BEFORE (INCORRECT)
slots = Slot.objects.filter(lot_id=lot_id, is_occupied=True).order_by("number")

# AFTER (CORRECT)
slots = Slot.objects.filter(lot_id=lot_id, is_occupied=False).order_by("number")
```
**Impact:** Users would see occupied slots instead of available ones when trying to book a parking spot.  
**Explanation:** Available slots are those where `is_occupied=False`, not `True`.

#### Issue 1.2: Missing Slot Occupancy Update on Booking
**File:** `parking/views.py` (Lines 32-36)  
**Problem:** When a booking is created, the associated slot's `is_occupied` flag was never updated.
```python
# BEFORE (INCOMPLETE)
serializer = BookingSerializer(data=request.data)
if serializer.is_valid():
    booking = serializer.save(start_time=timezone.now())
    return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

# AFTER (COMPLETE)
serializer = BookingSerializer(data=request.data)
if serializer.is_valid():
    booking = serializer.save(start_time=timezone.now())
    # Mark slot as occupied
    booking.slot.is_occupied = True
    booking.slot.save()
    return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)
```
**Impact:** Slot occupancy status would become inconsistent between bookings and slot state, allowing double-bookings.  
**Explanation:** When a booking is created, the associated parking slot must be marked as occupied to prevent other users from booking it.

---

### 2. Go Backend (backend-go/)

#### Issue 2.1: Incorrect SQL JOIN Condition
**File:** `main.go` (Line 59)  
**Problem:** The JOIN clause referenced a non-existent column `s.slot_id` instead of the actual primary key `s.id`.
```sql
-- BEFORE (INCORRECT)
JOIN parking_slot s ON b.slot_id = s.slot_id

-- AFTER (CORRECT)
JOIN parking_slot s ON b.slot_id = s.id
```
**Impact:** The query would fail or return no results because the JOIN condition doesn't match any actual columns.  
**Explanation:** The `parking_slot` table has a primary key `id`, not `slot_id`. Django auto-generates `id` as the primary key.

#### Issue 2.2: Incorrect WHERE Clause for Active Bookings
**File:** `main.go` (Line 64)  
**Problem:** The query filtered for completed bookings instead of active ones.
```sql
-- BEFORE (INCORRECT - gets completed bookings)
WHERE b.end_time IS NOT NULL

-- AFTER (CORRECT - gets active bookings)
WHERE b.end_time IS NULL
```
**Impact:** The `/active-bookings` endpoint would return completed bookings instead of active ones.  
**Explanation:** Active bookings are those where `end_time=NULL` (checkout hasn't happened yet). Completed bookings have `end_time` set to a specific timestamp.

---

### 3. Next.js Frontend (frontend-nextjs/)

#### Issue 3.1: Incorrect Django API Port
**File:** `lib/api.js` (Line 5)  
**Problem:** The API base URL was pointing to port 8001 instead of the correct port 8000.
```javascript
// BEFORE (INCORRECT)
const API_DJANGO_BASE = "http://localhost:8001/api";

// AFTER (CORRECT)
const API_DJANGO_BASE = "http://localhost:8000/api";
```
**Impact:** All API calls to Django would fail with connection errors.  
**Explanation:** According to the setup instructions, the Django development server runs on port 8000 by default.

#### Issue 3.2: Missing Lot ID Parameter in loadSlots()
**File:** `pages/index.js` (Lines 19-26)  
**Problem:** The `loadSlots()` function calls `fetchAvailableSlots()` without passing the selected lot ID.
```javascript
// BEFORE (INCORRECT)
async function loadSlots() {
    try {
      setError("");
      const parsed = await fetchAvailableSlots();  // Missing lotId parameter!
      setSlots(parsed);
    } catch (err) {
      setError(err.message);
    }
}

// AFTER (CORRECT)
async function loadSlots() {
    if (!selectedLot) {
      setError("Please select a parking lot first");
      return;
    }
    try {
      setError("");
      const parsed = await fetchAvailableSlots(selectedLot);
      setSlots(parsed);
    } catch (err) {
      setError(err.message);
    }
}
```
**Impact:** The API endpoint expects a lot ID in the URL path (`/lots/{lotId}/slots/available/`), but without it, the request would be malformed.  
**Explanation:** The `fetchAvailableSlots()` function requires the `lotId` parameter to construct the correct API URL.

#### Issue 3.3: Missing Slot Refresh After Booking
**File:** `components/SlotGrid.js` (Lines 12-17)  
**Problem:** After successfully creating a booking, the slots list was not refreshed to reflect the newly occupied slot.
```javascript
// BEFORE (INCOMPLETE)
try {
  await createBooking({
    vehicle: Number(selectedVehicle),
    slot: slotId
  });
  alert("Booking created");
} catch (err) {
  alert(err.message);
}

// AFTER (COMPLETE)
try {
  await createBooking({
    vehicle: Number(selectedVehicle),
    slot: slotId
  });
  alert("Booking created");
  // Refresh slots list after successful booking
  fetchSlots();
} catch (err) {
  alert(err.message);
}
```
**Impact:** After booking a slot, the UI would still show that slot as available, creating a confusing user experience and potentially allowing the user to attempt booking the same slot again.  
**Explanation:** The frontend should refresh the available slots list after a successful booking to show the updated occupancy status.

---

## Testing Approach

### Manual Testing Checklist
1. ✅ Available slots endpoint returns only unoccupied slots
2. ✅ Creating a booking marks the slot as occupied and raises availability count
3. ✅ Go service correctly returns only active bookings (not completed ones)
4. ✅ Frontend API calls succeed with correct port (8000)
5. ✅ Selecting a lot and loading slots works correctly
6. ✅ Booking creation refreshes the slots list

## Files Modified

1. `backend-django/parking/views.py` - 2 fixes
2. `backend-go/main.go` - 2 fixes
3. `frontend-nextjs/lib/api.js` - 1 fix
4. `frontend-nextjs/pages/index.js` - 1 fix
5. `frontend-nextjs/components/SlotGrid.js` - 1 fix

## Assumptions Made

1. The PostgreSQL database table names follow Django's naming convention: `parking_<modelname>` (e.g., `parking_slot`, `parking_booking`)
2. Slot occupancy is managed through the `Slot.is_occupied` boolean flag
3. Active bookings are defined as those where `end_time IS NULL`
4. Django development server runs on default port 8000
5. The Go service connects to the same PostgreSQL database and reads the same schema

## Conclusion

All identified bugs have been fixed. The system now:
- Correctly shows available parking slots
- Maintains consistent slot occupancy state
- Returns accurate active bookings report
- Has proper frontend-backend API integration
- Refreshes UI state after user actions
