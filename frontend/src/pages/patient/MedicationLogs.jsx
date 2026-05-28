import { useEffect, useMemo, useState } from "react";
import { medicationApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import {
  isWithinDoseWindow,
  getTimeWindowMessage,
  getCurrentIslamabadTime,
} from "../../utils/dateTime";

const PILL_STYLES = {
  taken: { background: "rgba(34, 197, 94, 0.14)", color: "#15803d" },
  missed: { background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" },
  pending: { background: "rgba(245, 158, 11, 0.14)", color: "#b45309" },
  active: { background: "rgba(37, 99, 235, 0.12)", color: "#1d4ed8" },
};

const DOSE_LABELS = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

const MedicationLogs = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [logs, setLogs] = useState([]);
  const [viewMode, setViewMode] = useState("today");
  const [dosePeriodFilter, setDosePeriodFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await medicationApi.getLogsByPatient(user.id);
      setLogs(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load medication logs."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const mark = async (logId, status, dosePeriod) => {
    if (!user?.id) return;

    // Check time window validation for marking as taken
    if (status === "taken" && dosePeriod) {
      if (!isWithinDoseWindow(dosePeriod)) {
        const message = getTimeWindowMessage(dosePeriod);
        alert(`Cannot mark as taken. ${message}`);
        return;
      }
    }

    try {
      await medicationApi.updateLogStatus(logId, status);
      loadLogs();
    } catch (err) {
      alert(getErrorMessage(err, "Failed to update medication log."));
    }
  };

  const isToday = (value) => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const visibleLogs = useMemo(() => {
    let filtered = logs;

    // Filter by today/all
    if (viewMode === "today") {
      filtered = filtered.filter((log) => isToday(log.scheduled_time));
    }

    // Filter by dose period
    if (dosePeriodFilter !== "all") {
      filtered = filtered.filter((log) => log.dose_period === dosePeriodFilter);
    }

    return filtered;
  }, [logs, viewMode, dosePeriodFilter]);

  return (
    <div className="page-shell">
      <section className="hero-panel">
        <div>
          <h1 className="eyebrow">Adherence</h1>
          <h2>Medication Logs</h2>
          <p className="muted">
            Keep track of your daily doses to ensure your treatment remains
            effective and on schedule.
          </p>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <div className="grid-layout" style={{ gridTemplateColumns: "1fr" }}>
        <section className="panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: 0 }}>Active Schedule</h3>
            <div className="inline-actions">
              <button
                type="button"
                className={
                  viewMode === "today" ? "btn-main small" : "btn-ghost small"
                }
                onClick={() => setViewMode("today")}
              >
                Today
              </button>
              <button
                type="button"
                className={
                  viewMode === "all" ? "btn-main small" : "btn-ghost small"
                }
                onClick={() => setViewMode("all")}
              >
                All Medications
              </button>
              <button className="btn-ghost small" onClick={loadLogs}>
                Refresh
              </button>
            </div>
          </div>

          {viewMode === "today" && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className={
                  dosePeriodFilter === "all"
                    ? "btn-main small"
                    : "btn-ghost small"
                }
                onClick={() => setDosePeriodFilter("all")}
              >
                All Times
              </button>
              <button
                type="button"
                className={
                  dosePeriodFilter === "morning"
                    ? "btn-main small"
                    : "btn-ghost small"
                }
                onClick={() => setDosePeriodFilter("morning")}
              >
                🌅 Morning
              </button>
              <button
                type="button"
                className={
                  dosePeriodFilter === "afternoon"
                    ? "btn-main small"
                    : "btn-ghost small"
                }
                onClick={() => setDosePeriodFilter("afternoon")}
              >
                ☀️ Afternoon
              </button>
              <button
                type="button"
                className={
                  dosePeriodFilter === "evening"
                    ? "btn-main small"
                    : "btn-ghost small"
                }
                onClick={() => setDosePeriodFilter("evening")}
              >
                🌙 Evening
              </button>
            </div>
          )}

          <div className="list-stack">
            {loading ? (
              <p className="muted" style={{ textAlign: "center", padding: 20 }}>
                Syncing schedule...
              </p>
            ) : visibleLogs.length ? (
              visibleLogs.map((l) => {
                const statusStyle =
                  PILL_STYLES[l.status] || PILL_STYLES.pending;
                const isWithinWindow = isWithinDoseWindow(l.dose_period);
                const canMarkTaken = l.status === "pending" && isWithinWindow;
                const timeWindowMsg = getTimeWindowMessage(l.dose_period);

                return (
                  <div
                    key={l.log_id || l.patient_medication_id}
                    className="list-item"
                    style={{
                      padding: 24,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 24,
                      opacity: l.status === "taken" ? 0.7 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          background: "rgba(37, 99, 235, 0.08)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 24,
                        }}
                      >
                        💊
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "1.3rem" }}>
                          {l.medication_name || "Medication"}
                        </h4>
                        <p
                          className="muted"
                          style={{
                            fontWeight: 700,
                            fontSize: "1rem",
                            marginBottom: 4,
                          }}
                        >
                          {DOSE_LABELS[l.dose_period] || "Scheduled"} dose:{" "}
                          {l.dose_dosage || l.dosage || "Dose not specified"}
                        </p>
                        <p
                          className="muted"
                          style={{ fontSize: "0.85rem", margin: "0 0 4px 0" }}
                        >
                          {l.status === "taken" && l.taken_at
                            ? `Taken: ${new Date(l.taken_at).toLocaleString()}`
                            : `Scheduled: ${l.scheduled_time ? new Date(l.scheduled_time).toLocaleString() : "N/A"}`}
                        </p>
                        {l.status === "pending" && l.dose_period && (
                          <p
                            style={{
                              fontSize: "0.8rem",
                              margin: 0,
                              color: isWithinWindow ? "#22c55e" : "#ef4444",
                              fontWeight: 600,
                            }}
                          >
                            {timeWindowMsg}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <span
                        className="status-pill"
                        style={{
                          ...statusStyle,
                          padding: "8px 16px",
                          fontSize: 13,
                        }}
                      >
                        {l.status || "pending"}
                      </span>

                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          className="btn-main small"
                          onClick={() => mark(l.log_id, "taken", l.dose_period)}
                          style={{
                            background: canMarkTaken ? "#22c55e" : "#cbd5e1",
                            boxShadow: canMarkTaken
                              ? "0 4px 12px rgba(34, 197, 94, 0.2)"
                              : "none",
                            cursor: canMarkTaken ? "pointer" : "not-allowed",
                          }}
                          disabled={l.status === "taken" || !canMarkTaken}
                          title={
                            !canMarkTaken && l.status === "pending"
                              ? timeWindowMsg
                              : ""
                          }
                        >
                          {l.status === "taken" ? "✓ Done" : "Mark Taken"}
                        </button>
                        <button
                          className="btn-ghost small"
                          onClick={() =>
                            mark(l.log_id, "missed", l.dose_period)
                          }
                          style={{ color: "#ef4444", borderColor: "#fecaca" }}
                          disabled={l.status === "taken"}
                        >
                          Missed
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
                <p className="muted" style={{ fontSize: "1.1rem" }}>
                  {viewMode === "today"
                    ? dosePeriodFilter !== "all"
                      ? `No ${DOSE_LABELS[dosePeriodFilter]?.toLowerCase()} medications scheduled for today.`
                      : "No medications scheduled for today."
                    : "No medications currently logged in your schedule."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MedicationLogs;
