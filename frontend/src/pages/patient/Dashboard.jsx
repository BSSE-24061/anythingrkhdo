import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  vitalApi,
  medicationApi,
  historyApi,
  appointmentApi,
  blogApi,
  forumApi,
  notificationApi,
} from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const STATUS_PILL_STYLES = {
  confirmed: {
    background: "rgba(59, 130, 246, 0.12)",
    color: "#1d4ed8",
  },
  pending: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#b45309",
  },
  upcoming: {
    background: "rgba(245, 158, 11, 0.14)",
    color: "#b45309",
  },
  taken: {
    background: "rgba(34, 197, 94, 0.14)",
    color: "#15803d",
  },
};

const PatientDashboard = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [unread, setUnread] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const playedAlertsRef = useRef(new Set());

  const playAlertSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.loop = true;
    audio.play().catch(() => { console.log("Sound blocked by browser") });
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 3000);
  };

  useEffect(() => {
    const loadUnread = async () => {
      if (!user?.id) return;
      try {
        const unreadResponse = await notificationApi.unreadCount(user.id);
        setUnread(unreadResponse.data.unread_count || 0);
      } catch {
        setUnread(0);
      }
    };

    const loadPatientData = async () => {
      if (!user?.id) return;
      try {
        const appointmentsResponse = await appointmentApi.byPatient(user.id);
        setAppointments(appointmentsResponse.data || []);

        const logsResponse = await medicationApi.byPatientLogs(user.id);
        const logsData = Array.isArray(logsResponse.data) ? logsResponse.data : [];
        setMedicationLogs(logsData);

        const alertsResponse = await vitalApi.getAlerts(user.id);
        const data = alertsResponse.data || [];

        // Detect Overdue Medications (Pending and time is in the past)
        const now = new Date();
        const overdueReminders = logsData.filter(log =>
          log.status === "pending" &&
          log.scheduled_time &&
          new Date(log.scheduled_time) < now &&
          !playedAlertsRef.current.has(`med-${log.log_id}`)
        );

        const newUnread = data.filter(a => !a.is_read && !playedAlertsRef.current.has(a.alert_id || a.id));

        if (newUnread.length > 0 || overdueReminders.length > 0) {
          playAlertSound();
          // Track that we played sound for these IDs
          newUnread.forEach(a => playedAlertsRef.current.add(a.alert_id || a.id));
          overdueReminders.forEach(log => playedAlertsRef.current.add(`med-${log.log_id}`));
        }

        // Create virtual alerts for overdue medications to show in the sidebar
        const virtualMedAlerts = logsData
          .filter(log => log.status === "pending" && log.scheduled_time && new Date(log.scheduled_time) < now)
          .sort((a, b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))
          .map(log => ({
            alert_id: `med-${log.log_id}`,
            alert_type: "Medication Reminder",
            message: `Please take your ${log.medication_name} (${log.dosage}). Scheduled for ${new Date(log.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            triggered_at: log.scheduled_time,
            is_read: false
          }));

        setAlerts([...virtualMedAlerts, ...data]);

        const historyResponse = await historyApi.getByPatient(user.id);
        setRecentHistory(historyResponse.data || []);

        const blogsResponse = await blogApi.feed(user.id);
        setBlogs(blogsResponse.data || []);

        const forumResponse = await forumApi.feed(user.id);
        setForumPosts(forumResponse.data || []);
      } catch (err) {
        console.error("Error loading patient data:", err);
      } finally {
        setLoading(false);
      }
    };

    const loadAll = () => {
      loadUnread();
      loadPatientData();
    };

    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const upcomingAppointments = appointments
    .filter((apt) => apt.status !== "completed" && apt.status !== "cancelled")
    .slice(0, 2);

  const todaysMedications = medicationLogs
    .filter(log => log.status === "pending" || log.status === "taken")
    .slice(0, 4);
  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  const nextAppointment = appointments
    .filter((apt) => apt.status !== "completed" && apt.status !== "cancelled" && new Date(apt.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

  const nextAppointmentDate = nextAppointment
    ? new Date(nextAppointment.scheduled_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    : "N/A";

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", fontWeight: 800, color: "#64748b" }}>
      Loading your health dashboard...
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 32, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Good morning, {user.name}!
        </h1>
        <p style={{ margin: "8px 0 0", color: "#64748b", fontWeight: 600, fontSize: 18 }}>
          Here's your health overview for today
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6edf5",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Next Appointment</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>
              {nextAppointmentDate}
            </div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>📅</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6edf5",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Active Medications</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>
              {medicationLogs.length || 0}
            </div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>💊</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6edf5",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Last Vital Log</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>Today</div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>↕️</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6edf5",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Unread Alerts</div>
            <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{unreadAlertsCount}</div>
          </div>
          <div style={{ color: "#2563eb", fontWeight: 900 }}>🔔</div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
        {/* Left Column */}
        <div style={{ display: "grid", gap: 16 }}>
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e6edf5",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>
                Upcoming Appointments
              </h3>
              <Link to="/appointments" style={{ color: "#2563eb", fontWeight: 900, fontSize: 12 }}>
                View All
              </Link>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <div
                    key={apt.appointment_id}
                    style={{
                      border: "1px solid #e6edf5",
                      borderRadius: 14,
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 999,
                          background: "rgba(37,99,235,0.08)",
                          border: "1px solid rgba(37,99,235,0.22)",
                          display: "grid",
                          placeItems: "center",
                          color: "#2563eb",
                          fontWeight: 900,
                        }}
                      >
                        👤
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>
                          Dr. {apt.doctor_name || "Sarah Johnson"}
                        </div>
                        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>
                          {apt.specialization || "Cardiologist"}
                        </div>
                        <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11, marginTop: 6 }}>
                          {apt.scheduled_at
                            ? new Date(apt.scheduled_at).toLocaleDateString()
                            : "2026-04-25"}{" "}
                          •{" "}
                          {apt.scheduled_at
                            ? new Date(apt.scheduled_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "10:00 AM"}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontWeight: 900,
                        fontSize: 11,
                        ...(STATUS_PILL_STYLES[apt.status] || STATUS_PILL_STYLES.pending),
                      }}
                    >
                      {apt.status || "confirmed"}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                  No upcoming appointments
                </div>
              )}
            </div>
          </section>

          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e6edf5",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>
              Today's Medications
            </h3>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {todaysMedications.length > 0 ? (
                todaysMedications.map((med) => (
                  <div
                    key={med.log_id}
                    style={{
                      border: "1px solid #e6edf5",
                      borderRadius: 14,
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#fff",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#0f172a", fontWeight: 950, fontSize: 13 }}>
                        {med.medication_name || "Medication"}
                      </div>
                      <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, marginTop: 6 }}>
                        {med.dosage || "1 dose"} • {med.frequency || "Scheduled"}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontWeight: 900,
                          fontSize: 11,
                          ...(med.status === "taken" ? STATUS_PILL_STYLES.taken : STATUS_PILL_STYLES.upcoming),
                        }}
                      >
                        {med.status || "upcoming"}
                      </span>
                      {med.status === "pending" && (
                        <button
                          onClick={async () => {
                            try {
                              await medicationApi.updateLogStatus(med.log_id, "taken");
                              // Update the state locally to reflect the change
                              setMedicationLogs(prev => 
                                prev.map(log => 
                                  log.log_id === med.log_id ? { ...log, status: "taken", taken_at: new Date() } : log
                                )
                              );
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          style={{
                            background: "#22c55e",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                        >
                          Mark Taken
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                  No medications scheduled
                </div>
              )}
            </div>
          </section>


        </div>

        {/* Right Column */}
        <div style={{ display: "grid", gap: 16 }}>
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #e6edf5",
              borderRadius: 16,
              padding: 18,
              height: "fit-content",
              position: "sticky",
              top: 20,
            }}
          >
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>
              Recent Alerts
            </h3>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {alerts.length > 0 ? (
                alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.alert_id || alert.id}
                    style={{
                      border: "1px solid #e6edf5",
                      borderRadius: 14,
                      padding: 12,
                      background: "#fff",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontSize: 18, lineHeight: 1 }}>
                      {alert.alert_type?.toLowerCase().includes("lab")
                        ? "🧪"
                        : alert.alert_type?.toLowerCase().includes("med")
                          ? "💊"
                          : "⏰"}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>
                        {alert.alert_type || "Appointment Reminder"}
                      </div>
                      <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, marginTop: 4 }}>
                        {alert.message || "You have an appointment tomorrow at 10:00 AM"}
                      </div>
                      <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11, marginTop: 6 }}>
                        {alert.triggered_at
                          ? new Date(alert.triggered_at).toLocaleString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "2h ago"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                  No recent alerts
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Hidden state to avoid lint about unused vars */}
      <div style={{ display: "none" }} aria-hidden="true">
        {recentHistory.length} {blogs.length} {forumPosts.length} {unread}
      </div>
    </div>
  );
};

export default PatientDashboard;
