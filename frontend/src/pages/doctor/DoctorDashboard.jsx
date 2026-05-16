import { useEffect, useState } from "react";
import { appointmentApi, notificationApi, vitalApi } from "../../utils/apiHelper";
import { patientsFromAppointments } from "../../utils/doctorPatients";
import { getStoredUser } from "../../utils/session";
import { formatIslamabadDateTime } from "../../utils/dateTime";

const DoctorDashboard = () => {
  const user = getStoredUser();
  const userId = user?.id;
  const [stats, setStats] = useState({ appointments: [], patients: [], alerts: [], notifications: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const [appointmentsRes, alertsRes, notificationsRes] = await Promise.all([
          appointmentApi.byDoctor(userId),
          vitalApi.alerts(userId),
          notificationApi.list(userId),
        ]);

        const appointments = appointmentsRes.data || [];
        setStats({
          appointments,
          patients: patientsFromAppointments(appointments),
          alerts: alertsRes.data || [],
          notifications: notificationsRes.data || [],
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const upcoming = stats.appointments.filter((item) => item.status !== "completed").slice(0, 5);
  const unreadNotifications = stats.notifications.filter((n) => !n.is_read).length;

  return (
    <>
      {/* Header */}
      <section className="page-heading">
        <div>
          <h1>Good morning, Dr. {user?.name || "Doctor"}!</h1>
          <p className="muted">Track appointments, patient activity, and important alerts</p>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="doctor-stats">
        <div className="stat-card">
          <p>Appointments</p>
          <strong>{loading ? "..." : stats.appointments.length}</strong>
        </div>
        <div className="stat-card">
          <p>Patients</p>
          <strong>{loading ? "..." : stats.patients.length}</strong>
        </div>
        <div className="stat-card">
          <p>Alerts</p>
          <strong>{loading ? "..." : stats.alerts.length}</strong>
        </div>
        <div className="stat-card">
          <p>Notifications</p>
          <strong>{loading ? "..." : unreadNotifications}</strong>
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <section className="grid-layout two-col">
        {/* Left - Upcoming Appointments */}
        <div className="card">
          <div className="section-heading">
            <h3>Upcoming Appointments</h3>
          </div>
          {upcoming.length ? (
            <div className="list-stack">
              {upcoming.map((appointment) => (
                <div className="list-item" key={appointment.appointment_id}>
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between" }}>
                    <div>
                      <strong style={{ display: "block", marginBottom: "4px" }}>
                        {appointment.patient_name || "Patient"}
                      </strong>
                      <span className="muted" style={{ fontSize: "0.9rem" }}>
                        {formatIslamabadDateTime(appointment.scheduled_at)}
                      </span>
                      <p style={{ margin: "8px 0 0 0", fontSize: "0.9rem" }}>
                        {appointment.reason || "No reason provided"}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        background: appointment.status === "confirmed" 
                          ? "rgba(34, 197, 94, 0.15)" 
                          : "rgba(243, 156, 18, 0.15)",
                        color: appointment.status === "confirmed" 
                          ? "var(--success)" 
                          : "var(--warning)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No upcoming appointments.</p>
          )}
        </div>

        {/* Right - Recent Alerts */}
        <div className="card">
          <div className="section-heading">
            <h3>Recent Alerts</h3>
          </div>
          {stats.alerts.length ? (
            <div className="list-stack">
              {stats.alerts.slice(0, 5).map((alert) => (
                <div className="list-item" key={alert.alert_id}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "start" }}>
                    <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>⚠️</span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block" }}>{alert.alert_type}</strong>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(243, 156, 18, 0.15)",
                          color: "var(--warning)",
                          display: "inline-block",
                          marginTop: "4px",
                        }}
                      >
                        {alert.severity}
                      </span>
                      <p className="muted" style={{ margin: "6px 0 0 0", fontSize: "0.85rem" }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No alerts yet.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default DoctorDashboard;
