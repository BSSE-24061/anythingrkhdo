import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentApi, chatApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import { formatIslamabadDateTime } from "../../utils/dateTime";

const statusLabel = (status) => (status === "cancelled" ? "rejected" : status);

const statusClass = (status) => `doctor-status-pill status-${status || "unknown"}`;

const Appointments = () => {
  const user = getStoredUser();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const response = await appointmentApi.byDoctor(user.id);
        setAppointments(response.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const changeStatus = async (appointmentId, status) => {
    try {
      setError("");
      const response = await appointmentApi.updateStatus(appointmentId, status);
      const updatedStatus = response.data?.appointment?.status || status;
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.appointment_id === appointmentId
            ? { ...appointment, status: updatedStatus }
            : appointment,
        ),
      );
    } catch (error) {
      console.error(error);
      setError(error?.response?.data?.error || "Unable to update appointment status");
    }
  };

  const openChat = async (appointment) => {
    try {
      const roomResponse = await chatApi.findOrCreateRoom({
        patient_user_id: appointment.patient_user_id,
        doctor_user_id: user.id,
        room_type: "consultation",
      });

      navigate(`/doctor/chat?room=${roomResponse.data.room.room_id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const activeAppointments = appointments.filter((appointment) =>
    ["pending", "confirmed"].includes(appointment.status),
  );
  const completedAppointments = appointments.filter((appointment) => appointment.status === "completed");
  const rejectedAppointments = appointments.filter((appointment) => appointment.status === "cancelled");

  const renderAppointment = (appointment) => (
    <div className="appointment-card" key={appointment.appointment_id}>
      <div className="section-heading">
        <div>
          <h3>{appointment.patient_name || "Patient"}</h3>
          <span>{formatIslamabadDateTime(appointment.scheduled_at)}</span>
        </div>
        <span className={statusClass(appointment.status)}>
          {statusLabel(appointment.status)}
        </span>
      </div>

      <p className="muted">{appointment.reason || "No reason provided"}</p>

      <div className="inline-actions wrap">
        {appointment.status === "pending" && (
          <>
            <button className="btn-main small" onClick={() => changeStatus(appointment.appointment_id, "confirmed")}>Confirm</button>
            <button className="btn-soft small" onClick={() => changeStatus(appointment.appointment_id, "cancelled")}>Reject</button>
          </>
        )}
        {appointment.status === "confirmed" && (
          <button className="btn-soft small" onClick={() => changeStatus(appointment.appointment_id, "completed")}>Mark Done</button>
        )}
        {["pending", "confirmed"].includes(appointment.status) && (
          <button className="btn-soft small" onClick={() => openChat(appointment)}>Chat</button>
        )}
        {appointment.status === "confirmed" && (
          <button
            className="btn-soft small"
            onClick={() => navigate(`/doctor/prescriptions?patient=${appointment.patient_user_id}&appointment=${appointment.appointment_id}`)}
          >
            Prescribe
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Appointments</h1>
          <p className="muted">Confirm, complete, or open a patient chat from the schedule.</p>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      <section className="record-panel">
        <div className="section-heading">
          <h3>Active</h3>
        </div>
        <div className="resource-grid compact">
        {loading ? (
          <p>Loading appointments...</p>
        ) : activeAppointments.length ? (
          activeAppointments.map(renderAppointment)
        ) : (
          <p className="muted">No pending or confirmed appointments.</p>
        )}
        </div>
      </section>

      {!loading && (
        <section className="record-panel" style={{ marginTop: 20 }}>
          <div className="section-heading">
            <h3>Completed</h3>
          </div>
          <div className="resource-grid compact">
          {completedAppointments.length
            ? completedAppointments.map(renderAppointment)
            : <p className="muted">No completed appointments.</p>}
          </div>
        </section>
      )}

      {!loading && (
        <section className="record-panel" style={{ marginTop: 20 }}>
          <div className="section-heading">
            <h3>Rejected</h3>
          </div>
          <div className="resource-grid compact">
          {rejectedAppointments.length
            ? rejectedAppointments.map(renderAppointment)
            : <p className="muted">No rejected appointments.</p>}
          </div>
        </section>
      )}
    </>
  );
};

export default Appointments;
