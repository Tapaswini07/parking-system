import { useState } from "react";
import { createBooking } from "../lib/api";

export default function SlotGrid({ slots, selectedVehicle, fetchSlots, selectedLotName }) {
  const [bookingInProgress, setBookingInProgress] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  async function handleBook(slotId, slotNumber) {
    setBookingError(null);
    
    if (!selectedVehicle) {
      setBookingError("Please select a vehicle first");
      return;
    }

    try {
      setBookingInProgress(slotId);
      await createBooking({
        vehicle: Number(selectedVehicle),
        slot: slotId
      });
      
      setBookingSuccess(`✅ Booked Slot ${slotNumber}!`);
      setTimeout(() => setBookingSuccess(null), 3000);
      
      // Refresh slots list after successful booking
      await new Promise(r => setTimeout(r, 500));
      fetchSlots();
    } catch (err) {
      setBookingError(`❌ Failed: ${err.message}`);
    } finally {
      setBookingInProgress(null);
    }
  }

  if (!slots.length) {
    return null;
  }

  return (
    <>
      <style>{`
        .slot-btn {
          padding: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
          min-height: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .slot-btn:hover { border-color: #0070f3; background: #f0f7ff; }
        .slot-btn:active { transform: scale(0.98); }
        .slot-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .slot-btn.loading { background: #ffd700; }
      `}</style>

      {bookingSuccess && (
        <div style={{ backgroundColor: "#d4edda", color: "#155724", padding: 12, borderRadius: 4, marginBottom: 12 }}>
          {bookingSuccess}
        </div>
      )}
      
      {bookingError && (
        <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: 12, borderRadius: 4, marginBottom: 12 }}>
          {bookingError}
        </div>
      )}

      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", marginBottom: 20 }}>
        {slots.map((slot) => (
          <button
            key={slot.id}
            className={`slot-btn ${bookingInProgress === slot.id ? "loading" : ""}`}
            onClick={() => handleBook(slot.id, slot.number)}
            disabled={bookingInProgress !== null || !selectedVehicle}
            title={`Book Slot ${slot.number} at ${selectedLotName}`}
          >
            <span style={{ fontSize: 24, marginBottom: 4 }}>📍</span>
            <span>Slot {slot.number}</span>
            <span style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Available</span>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 12 }}>
        {selectedVehicle ? `Booking with Vehicle ${selectedVehicle}` : "Select a vehicle to book"}
      </div>
    </>
  );
}
