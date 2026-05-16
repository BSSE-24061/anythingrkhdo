import { useEffect, useState } from "react";
import { vitalApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Alerts = () => {
  const user = getStoredUser();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAlerts = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const response = await vitalApi.alerts(user.id);
      setAlerts(response.data || []);

      const hasUnread = (response.data || []).some(a => !a.is_read);
      if (hasUnread) {
        vitalApi.markAlertsRead(user.id).catch(console.error);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load health alerts."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="page-shell">
      <section className="hero-panel" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #fff 100%)" }}>
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
        <section className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Recent Notifications</h3>
            <button className="btn-ghost small" onClick={loadAlerts}>Refresh</button>
          </div>

          <div className="list-stack">
            {loading ? (
              <p className="muted" style={{ textAlign: "center", padding: 20 }}>Checking for updates...</p>
            ) : alerts.length ? alerts.map((alert) => (
              <div
                key={alert.alert_id || alert.id}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  padding: 20,
                  background: alert.is_read ? "#fff" : "rgba(254, 242, 242, 0.5)",
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  borderLeft: alert.is_read ? "1px solid var(--line)" : "4px solid #ef4444"
                }}
              >
                <div style={{ fontSize: 24 }}>
                  {alert.alert_type?.toLowerCase().includes("vital") ? "📊" : 
                   alert.alert_type?.toLowerCase().includes("lab") ? "🧪" : "🚨"}
                </div>
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
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
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
