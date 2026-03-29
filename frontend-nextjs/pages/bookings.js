import { useEffect, useState } from "react";
import { fetchActiveBookingsReport, fetchBookings } from "../lib/api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [activeReport, setActiveReport] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [bookingRows, reportRows] = await Promise.all([
        fetchBookings(),
        fetchActiveBookingsReport()
      ]);
      setBookings(bookingRows);
      setActiveReport(reportRows);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const activeBookings = bookings.filter((b) => !b.end_time);

  return (
    <main style={styles.main}>
      <style>{`
        .data-card { background: white; padding: 16px; border-radius: 4px; margin-bottom: 16px; border: 1px solid #ddd; }
        .booking-item { background: #f8f9fa; padding: 12px; margin-bottom: 8px; border-radius: 4px; border-left: 4px solid #0070f3; }
        .booking-item.completed { border-left-color: #6c757d; opacity: 0.7; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        button { padding: 8px 16px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0051cc; }
      `}</style>

      <h1>📋 Bookings & Reports</h1>

      <div style={styles.controls}>
        <button onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "🔄 Refresh"}
        </button>
        <label style={styles.checkboxLabel}>
          <input 
            type="checkbox" 
            checked={autoRefresh} 
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (5s)
        </label>
        {lastUpdate && <span style={styles.timestamp}>Updated: {lastUpdate}</span>}
      </div>

      {error && (
        <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: 12, borderRadius: 4, marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}

      <div class="data-card">
        <h3>Django Bookings API</h3>
        <p><strong>Total Bookings:</strong> {bookings.length}</p>
        <p><strong>Active Bookings:</strong> {activeBookings.length}</p>
        <p><strong>Completed:</strong> {bookings.length - activeBookings.length}</p>

        {bookings.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Slot</th>
                <th>Parking Lot</th>
                <th>Started</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.vehicle?.number_plate || "N/A"}</td>
                  <td>#{b.slot?.number || "N/A"}</td>
                  <td>{b.slot?.lot?.name || "N/A"}</td>
                  <td>{new Date(b.start_time).toLocaleTimeString()}</td>
                  <td>{b.end_time ? "✅ Completed" : "🚗 Active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No bookings yet.</p>
        )}
      </div>

      <div class="data-card">
        <h3>Go Active Bookings Report</h3>
        <p><strong>Active Right Now:</strong> {activeReport.length}</p>

        {activeReport.length > 0 ? (
          activeReport.map((b) => (
            <div key={b.booking_id} class="booking-item">
              <strong>🚗 {b.number_plate}</strong> - Slot {b.slot_number} @ {b.lot_name}
              <br />
              <small>Started: {new Date(b.start_time).toLocaleString()}</small>
            </div>
          ))
        ) : (
          <p>No active bookings at the moment. 🅿️</p>
        )}
      </div>

      <div style={{ marginTop: 20, padding: 12, backgroundColor: "#f8f9fa", borderRadius: 4, fontSize: 12, color: "#666" }}>
        <p>💡 <strong>Tips:</strong></p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Active bookings are those with no end time</li>
          <li>Use auto-refresh to monitor bookings in real-time</li>
          <li>The Go API provides a read-only report of active bookings</li>
        </ul>
      </div>
    </main>
  );
}

const styles = {
  main: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginLeft: "auto",
  },
};
