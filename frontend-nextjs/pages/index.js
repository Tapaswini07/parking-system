import { useEffect, useState, useCallback } from "react";
import SlotGrid from "../components/SlotGrid";
import { fetchAvailableSlots, fetchLots } from "../lib/api";

export default function HomePage() {
  const [lots, setLots] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedLot, setSelectedLot] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Load lots on mount
  useEffect(() => {
    fetchLots()
      .then(setLots)
      .catch((err) => setError(err.message))
      .finally(() => setLotsLoading(false));
  }, []);

  // Auto-refresh slots
  useEffect(() => {
    if (!autoRefresh || !selectedLot) return;
    const interval = setInterval(loadSlots, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedLot]);

  async function loadSlots() {
    if (!selectedLot) {
      setError("Please select a parking lot first");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const parsed = await fetchAvailableSlots(selectedLot);
      setSlots(parsed);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const availableCount = slots.length;
  const selectedLotName = lots.find((lot) => lot.id == selectedLot)?.name || "";

  return (
    <main style={styles.main}>
      <style>{`
        input, select, button { font-size: 14px; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; }
        button { background: #0070f3; color: white; cursor: pointer; border: none; }
        button:hover { background: #0051cc; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        select { width: 100%; }
        .status { font-size: 12px; color: #666; margin-top: 4px; }
      `}</style>

      <h1>🅿️ Parking Management</h1>

      {lotsLoading ? (
        <p style={styles.loading}>Loading parking lots...</p>
      ) : (
        <>
          <div style={styles.formGroup}>
            <label htmlFor="lot">Parking Lot *</label>
            <select 
              id="lot" 
              value={selectedLot} 
              onChange={(e) => {
                setSelectedLot(e.target.value);
                setSlots([]);
              }}
            >
              <option value="">Select a parking lot</option>
              {lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="vehicle">Vehicle ID *</label>
            <input
              id="vehicle"
              type="number"
              placeholder="e.g. 1, 2, 3, 4"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            />
          </div>

          <div style={styles.buttonGroup}>
            <button 
              onClick={loadSlots} 
              disabled={!selectedLot || loading}
              style={{ opacity: !selectedLot || loading ? 0.6 : 1 }}
            >
              {loading ? "Loading..." : "🔄 Load Slots"}
            </button>
            <label style={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (5s)
            </label>
          </div>

          {selectedLot && (
            <div style={styles.stats}>
              <p><strong>Location:</strong> {selectedLotName}</p>
              <p><strong>Available:</strong> {availableCount} slots {autoRefresh && "🔄"}</p>
              {lastUpdate && <p style={styles.status}>Updated: {lastUpdate}</p>}
            </div>
          )}

          {error && <p style={styles.error}>❌ {error}</p>}

          {selectedLot && slots.length === 0 && !loading && !error && (
            <p style={styles.info}>ℹ️ No available slots. Try another time.</p>
          )}

          {selectedLot && availableCount > 0 && (
            <>
              <h3 style={styles.slotsTitle}>Available Slots ({availableCount})</h3>
              <SlotGrid 
                slots={slots} 
                selectedVehicle={selectedVehicle} 
                fetchSlots={loadSlots}
                selectedLotName={selectedLotName}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}

const styles = {
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  formGroup: {
    marginBottom: 16,
  },
  buttonGroup: {
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
    fontSize: 14,
  },
  stats: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderLeft: "4px solid #0070f3",
  },
  slotsTitle: {
    marginTop: 20,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 600,
  },
  error: {
    color: "#d41b1b",
    backgroundColor: "#ffe0e0",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  info: {
    color: "#056399",
    backgroundColor: "#e0f2ff",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  loading: {
    textAlign: "center",
    color: "#666",
    padding: 40,
  },
};
