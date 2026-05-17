import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { userApi, appointmentApi, availabilityApi, chatApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";
import {
  createIslamabadDateTimeValue,
  formatIslamabadDateTime,
  getIslamabadDateValue,
  getIslamabadTimeValue,
  getIslamabadWeekday,
} from "../utils/dateTime";

const DoctorsBySpecialization = () => {
  const rawParam = useParams().specialization || "";
  const specialization = decodeURIComponent(rawParam);

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bookingFor, setBookingFor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [schedule, setSchedule] = useState({
    appointment_date: "",
    slot_start_time: "",
    duration_minutes: 30,
    reason: "",
  });

  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await userApi.getDoctorsBySpecialization(specialization);
        setDoctors(Array.isArray(response.data) ? response.data : []);
      } catch {
        setError("Failed to load doctors for this specialization.");
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, [specialization]);

  const openBooking = (doctor) => {
    setMessage("");
    setError("");
    setBookingFor(doctor);
    setAvailableSlots([]);
    setSchedule({
      appointment_date: "",
      slot_start_time: "",
      duration_minutes: 30,
      reason: `Consultation (${specialization})`,
    });
  };

  const toLocalDateValue = (value) => {
    return getIslamabadDateValue(value);
  };

  useEffect(() => {
    const loadSlots = async () => {
      if (!bookingFor?.user_id || !schedule.appointment_date) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setError("");

      try {
        const [availabilityResponse, appointmentsResponse] = await Promise.all([
          availabilityApi.getDoctor(bookingFor.user_id),
          appointmentApi.byDoctor(bookingFor.user_id),
        ]);

        const selectedDay = getIslamabadWeekday(schedule.appointment_date);
        const bookedStarts = new Set(
          (appointmentsResponse.data || [])
            .filter((appointment) => appointment.status !== "cancelled")
            .filter((appointment) => toLocalDateValue(appointment.scheduled_at) === schedule.appointment_date)
            .map((appointment) => getIslamabadTimeValue(appointment.scheduled_at)),
        );

        const slots = (availabilityResponse.data || [])
          .filter((slot) => slot.day_of_week === selectedDay)
          .filter((slot) => !bookedStarts.has(String(slot.start_time).slice(0, 5)));

        setAvailableSlots(slots);
        if (slots.length === 0) {
          setError(`No available slots for ${bookingFor.full_name} on ${selectedDay}.`);
        }
      } catch (err) {
        setAvailableSlots([]);
        setError(getErrorMessage(err, "Unable to load available slots."));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [bookingFor, schedule.appointment_date]);

  const bookAppointment = async (e) => {
    e.preventDefault();
    if (!bookingFor || user?.role !== "patient") return;

    try {
      setError("");
      setMessage("");
      const scheduledIso =
        schedule.appointment_date && schedule.slot_start_time
          ? createIslamabadDateTimeValue(schedule.appointment_date, schedule.slot_start_time)
          : "";

      await appointmentApi.create({
        patient_user_id: user.id,
        doctor_user_id: bookingFor.user_id,
        scheduled_at: scheduledIso,
        appointment_date: schedule.appointment_date,
        slot_start_time: schedule.slot_start_time,
        duration_minutes: Number(schedule.duration_minutes) || 30,
        reason: schedule.reason || `Consultation — ${specialization}`,
      });

      await chatApi.findOrCreateRoom({
        patient_user_id: user.id,
        doctor_user_id: bookingFor.user_id,
        room_type: "appointment",
      });

      setMessage(
        `${bookingFor.full_name}: appointment booked for ${formatIslamabadDateTime(scheduledIso)}. You can message them from Chat while your visit stays pending or confirmed.`,
      );
      setBookingFor(null);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Booking failed — pick another time or verify you are logged in as a patient.",
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="content-page">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="content-page">
      <section className="panel">
        <p className="eyebrow">Specialty care</p>
        <h2>{specialization} specialists</h2>
        <p className="muted">Verified profiles that list this specialization</p>

        {error && <p className="error-text">{error}</p>}
        {message && <p className="alert alert-success">{message}</p>}

        {doctors.length === 0 ? (
          <p className="muted">No verified doctors matched this specialization yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Hospital</th>
                  <th>Experience</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.user_id}>
                    <td>{doctor.full_name}</td>
                    <td>{doctor.hospital_name || "—"}</td>
                    <td>
                      {doctor.experience_years != null
                        ? `${doctor.experience_years} yrs`
                        : "—"}
                    </td>
                    <td>
                      {user?.role === "patient" ? (
                        <button
                          type="button"
                          className="btn-main small"
                          onClick={() => openBooking(doctor)}
                        >
                          Choose &amp; book
                        </button>
                      ) : (
                        <span className="muted">
                          Patients can book after signing in.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          <Link to="/specializations" className="btn-ghost small">
            ← Back to specialties
          </Link>
        </div>
      </section>

      {bookingFor && (
        <section className="panel">
          <h3>Book {bookingFor.full_name}</h3>
          <form className="form-grid" onSubmit={bookAppointment}>
            <label>
              Appointment date
              <input
                type="date"
                value={schedule.appointment_date}
                onChange={(e) =>
                  setSchedule((s) => ({
                    ...s,
                    appointment_date: e.target.value,
                    slot_start_time: "",
                  }))
                }
                required
              />
            </label>
            <label>
              Available slot
              <select
                value={schedule.slot_start_time}
                onChange={(e) =>
                  setSchedule((s) => ({ ...s, slot_start_time: e.target.value }))
                }
                disabled={!schedule.appointment_date || loadingSlots}
                required
              >
                <option value="">
                  {loadingSlots ? "Loading slots..." : "Select a slot"}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot.availability_id} value={slot.start_time}>
                    {slot.start_time} - {slot.end_time}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notes for the clinician
              <input
                type="text"
                value={schedule.reason}
                onChange={(e) =>
                  setSchedule((s) => ({ ...s, reason: e.target.value }))
                }
                required
              />
            </label>
            <div className="inline-actions">
              <button type="submit" className="btn-main small">
                Confirm booking
              </button>
              <button
                type="button"
                className="btn-ghost small"
                onClick={() => setBookingFor(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default DoctorsBySpecialization;
