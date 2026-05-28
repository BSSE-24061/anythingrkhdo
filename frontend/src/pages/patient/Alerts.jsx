import { useEffect, useState, useCallback, useRef } from "react";
import { vitalApi, medicationApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Alerts = () => {
  const user = getStoredUser();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tracks which alert IDs have already triggered a sound this session
  const playedAlertsRef = useRef(new Set());

  const playAlertSound = useCallback(() => {
    try {
      // Using a reliable notification sound URL
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.loop = true;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Autoplay prevented. Sound will play after your next click on the page.", err);
        });
      }

      // Stop after 3 seconds
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 3000);
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, []);

  const loadAlerts = useCallback(async (isInitial = false) => {
    if (!user?.id) return;
    try {
      if (isInitial) setLoading(true);

      const [alertsRes, logsRes] = await Promise.all([
        vitalApi.getAlerts(user.id),
        medicationApi.byPatientLogs(user.id)
      ]);

      const data = alertsRes.data || [];
      const logsData = Array.isArray(logsRes.data) ? logsRes.data : [];
      const now = new Date();

      // Generate reminders for pending meds that were missed
      const medicationAlerts = logsData
        .filter(log => log.status === "pending" && log.scheduled_time && new Date(log.scheduled_time) < now)
        .map(log => ({
          alert_id: `med-${log.log_id}`,
          alert_type: "Medication Reminder",
          message: `Scheduled dose for ${log.medication_name} (${log.dosage}) was missed. Please check your medication logs.`,
          triggered_at: log.scheduled_time,
          is_read: false
        }));

      const combined = [...medicationAlerts, ...data];

      // Check if there are any unread alerts to trigger the sound
      const newUnreadAlerts = combined.filter(a =>
        !a.is_read && !playedAlertsRef.current.has(a.alert_id || a.id)
      );

      if (newUnreadAlerts.length > 0) {
        playAlertSound();
        newUnreadAlerts.forEach(a => playedAlertsRef.current.add(a.alert_id || a.id));
      }

      setAlerts(combined);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load health alerts."));
    } finally {
      setLoading(false);
    }
  }, [user?.id, playAlertSound]);

  const handleMarkAsRead = async () => {
    if (!user?.id) return;
    try {
      await vitalApi.markAlertsRead(user.id);
      loadAlerts(false); // Refresh list to clear badges
    } catch (err) {
      console.error("Failed to mark alerts as read", err);
    }
  };

  useEffect(() => {
    loadAlerts(true);
    // Poll for new alerts every 10 seconds
    const interval = setInterval(() => loadAlerts(false), 10000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  return (
    <div className="page-shell">
      <section className="hero-panel alerts-hero">
        <div>
          <h1 className="eyebrow" style={{ color: "#be123c" }}>Monitoring</h1>
          <h2 style={{ color: "#881337" }}>Health Alerts</h2>
          <p className="muted" style={{ color: "#9f1239" }}>
            Important notifications regarding your vitals and medical status.
          </p>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <div className="grid-layout" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel record-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Recent Notifications</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-ghost small" onClick={() => loadAlerts(false)}>Refresh</button>
              <button className="btn-primary small" onClick={handleMarkAsRead}>Clear Badges</button>
            </div>
          </div>

          <div className="list-stack">
            {loading ? (
              <p className="muted" style={{ textAlign: "center", padding: 20 }}>Checking for updates...</p>
            ) : alerts.length ? alerts.map((alert) => (
              <div
                key={alert.alert_id || alert.id}
                className={`alert-card ${alert.is_read ? "read" : "unread"}`}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "1.1rem" }}>{alert.alert_type || "Health Notification"}</strong>
                    <small className="muted">{new Date(alert.triggered_at).toLocaleString()}</small>
                  </div>
                  <p style={{ margin: "4px 0 0", color: "var(--text)" }}>{alert.message}</p>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: 60 }}>
                <p className="muted" style={{ fontSize: "1.1rem" }}>No active health alerts. Everything looks good!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Alerts;
