import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { appointmentApi, availabilityApi, userApi, chatApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";
import {
  formatIslamabadDateTime,
  createIslamabadDateTimeIso,
  createIslamabadDateTimeValue,
  getIslamabadDateValue,
  getIslamabadTimeValue,
  getIslamabadWeekday,
} from "../utils/dateTime";

const statusLabel = (status) => (status === "cancelled" ? "rejected" : status);

const getDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getNextSevenDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    const dateValue = getDateValue(date);
    return {
      date: dateValue,
      day: getIslamabadWeekday(dateValue),
    };
  });
};

const Appointments = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [weekSlots, setWeekSlots] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    doctor_user_id: "",
    appointment_date: "",
    slot_start_time: "",
    reason: "",
    duration_minutes: 30,
  });

  const toLocalDateValue = (value) => {
    return getIslamabadDateValue(value);
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const rangesOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

  const isFutureSlot = (dateValue, timeValue) => {
    const iso = createIslamabadDateTimeIso(dateValue, timeValue);
    return iso && new Date(iso).getTime() > Date.now();
  };

  const loadAppointments = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError("");
      const response =
        user.role === "doctor"
          ? await appointmentApi.byDoctor(user.id)
          : await appointmentApi.byPatient(user.id);
      setAppointments(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError("Unable to load appointments.");
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const loadDoctorsForPatient = async () => {
      if (user?.role !== "patient") return;
      setLoadingDoctors(true);
      try {
        const response = await userApi.list();
        const rows = Array.isArray(response.data) ? response.data : [];
        setDoctors(
          rows.filter(
            (row) =>
              row.role === "doctor" &&
              row.is_verified !== false &&
              row.is_active !== false,
          ),
        );
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctorsForPatient();
  }, [user?.role]);

  useEffect(() => {
    const loadSlots = async () => {
      if (user?.role !== "patient" || !form.doctor_user_id || !form.appointment_date) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setError("");

      try {
        const [availabilityResponse, appointmentsResponse] = await Promise.all([
          availabilityApi.getDoctor(form.doctor_user_id),
          appointmentApi.byDoctor(form.doctor_user_id),
        ]);

        const selectedDay = getIslamabadWeekday(form.appointment_date);
        const bookedRanges = (appointmentsResponse.data || [])
          .filter((appointment) => appointment.status !== "cancelled")
          .filter((appointment) => toLocalDateValue(appointment.scheduled_at) === form.appointment_date)
          .map((appointment) => {
            const start = timeToMinutes(getIslamabadTimeValue(appointment.scheduled_at));
            const duration = Number(appointment.duration_minutes) || 30;
            return { start, end: start + duration };
          });

        const slots = (availabilityResponse.data || [])
          .filter((slot) => slot.day_of_week === selectedDay)
          .flatMap((slot) => {
            const windowStart = timeToMinutes(slot.start_time);
            const windowEnd = timeToMinutes(slot.end_time);
            const generatedSlots = [];

            for (let start = windowStart; start + 30 <= windowEnd; start += 30) {
              const end = start + 30;
              const isBooked = bookedRanges.some((booking) =>
                rangesOverlap(start, end, booking.start, booking.end),
              );

              if (!isBooked && isFutureSlot(form.appointment_date, minutesToTime(start))) {
                generatedSlots.push({
                  availability_id: `${slot.availability_id}-${start}`,
                  start_time: minutesToTime(start),
                  end_time: minutesToTime(end),
                });
              }
            }

            return generatedSlots;
          });

        setAvailableSlots(slots);
        if (slots.length === 0) {
          setError(`No available slots for this doctor on ${selectedDay}.`);
        }
      } catch (err) {
        setAvailableSlots([]);
        setError(getErrorMessage(err, "Unable to load available slots."));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [form.doctor_user_id, form.appointment_date, user?.role]);

  useEffect(() => {
    const loadWeekSlots = async () => {
      if (user?.role !== "patient" || !form.doctor_user_id) {
        setWeekSlots([]);
        return;
      }

      try {
        const [availabilityResponse, appointmentsResponse] = await Promise.all([
          availabilityApi.getDoctor(form.doctor_user_id),
          appointmentApi.byDoctor(form.doctor_user_id),
        ]);
        const availability = availabilityResponse.data || [];
        const appointments = appointmentsResponse.data || [];

        const groupedSlots = getNextSevenDays().map(({ date, day }) => {
          const bookedRanges = appointments
            .filter((appointment) => appointment.status !== "cancelled")
            .filter((appointment) => toLocalDateValue(appointment.scheduled_at) === date)
            .map((appointment) => {
              const start = timeToMinutes(getIslamabadTimeValue(appointment.scheduled_at));
              const duration = Number(appointment.duration_minutes) || 30;
              return { start, end: start + duration };
            });

          const slots = availability
            .filter((slot) => slot.day_of_week === day)
            .flatMap((slot) => {
              const windowStart = timeToMinutes(slot.start_time);
              const windowEnd = timeToMinutes(slot.end_time);
              const generatedSlots = [];

              for (let start = windowStart; start + 30 <= windowEnd; start += 30) {
                const end = start + 30;
                const startTime = minutesToTime(start);
                const isBooked = bookedRanges.some((booking) =>
                  rangesOverlap(start, end, booking.start, booking.end),
                );

                if (!isBooked && isFutureSlot(date, startTime)) {
                  generatedSlots.push({
                    id: `${date}-${start}`,
                    start_time: startTime,
                    end_time: minutesToTime(end),
                  });
                }
              }

              return generatedSlots;
            });

          return { date, day, slots };
        });

        setWeekSlots(groupedSlots);
      } catch {
        setWeekSlots([]);
      }
    };

    loadWeekSlots();
  }, [form.doctor_user_id, user?.role]);

  const createAppointment = async (e) => {
    e.preventDefault();
    if (user?.role !== "patient") return;

    setSuccess("");
    setError("");

    try {
      const scheduledIso =
        form.appointment_date && form.slot_start_time
          ? createIslamabadDateTimeValue(form.appointment_date, form.slot_start_time)
          : "";

      await appointmentApi.create({
        patient_user_id: user.id,
        doctor_user_id: form.doctor_user_id,
        scheduled_at: scheduledIso,
        appointment_date: form.appointment_date,
        slot_start_time: form.slot_start_time,
        duration_minutes: Number(form.duration_minutes) || 30,
        reason: form.reason || "Consultation",
      });

      await chatApi.findOrCreateRoom({
        patient_user_id: user.id,
        doctor_user_id: form.doctor_user_id,
        room_type: "appointment",
      });

      setForm({
        doctor_user_id: "",
        appointment_date: "",
        slot_start_time: "",
        reason: "",
        duration_minutes: 30,
      });
      setAvailableSlots([]);
      await loadAppointments();
      setSuccess(
        `Appointment booked for ${formatIslamabadDateTime(scheduledIso)}. You can chat with your doctor from the Chat page while your visit stays pending or confirmed.`,
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not complete booking — check selections and datetime.",
        ),
      );
    }
  };

  const updateStatus = async (appointmentId, status) => {
    try {
      setError("");
      await appointmentApi.updateStatus(appointmentId, status);
      loadAppointments();
    } catch {
      setError("Unable to update appointment status.");
    }
  };

  return (
    <div className="content-page">
      <section className="panel">
        <p className="eyebrow">Scheduling</p>
        <h2>Appointments</h2>
        <p className="muted">
          {user?.role === "doctor"
            ? "Review your schedule and update visit status."
            : "Book with a verified doctor or browse specializations to match the right specialist."}
        </p>

        {user?.role === "patient" && (
          <p className="muted" style={{ marginTop: 8 }}>
            Prefer to pick by specialty?{" "}
            <Link to="/specializations" style={{ color: "var(--accent)" }}>
              Browse specializations
            </Link>{" "}
            or{" "}
            <Link to="/consultant" style={{ color: "var(--accent)" }}>
              talk to a consultant
            </Link>{" "}
            if you are unsure who to see.
          </p>
        )}

        {error && <p className="error-text">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}

        {user?.role === "patient" && (
          <form onSubmit={createAppointment} className="form-grid" style={{ marginTop: 16 }}>
            <label>
              Doctor
              <select
                value={form.doctor_user_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    doctor_user_id: e.target.value,
                    slot_start_time: "",
                  }))
                }
                required
              >
                <option value="">
                  {loadingDoctors ? "Loading doctors..." : "Select a doctor"}
                </option>
                {doctors.map((doc) => (
                  <option key={doc.user_id} value={doc.user_id}>
                    {doc.full_name}
                    {doc.specialization ? ` — ${doc.specialization}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid two-column">
              <label>
                Date
                <input
                  type="date"
                  min={getDateValue(new Date())}
                  value={form.appointment_date}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
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
                  value={form.slot_start_time}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      slot_start_time: e.target.value,
                    }))
                  }
                  required
                  disabled={!form.doctor_user_id || !form.appointment_date || loadingSlots}
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
            </div>

            {form.doctor_user_id && (
              <div>
                <label>Remaining slots this week</label>
                <div className="list-stack">
                  {weekSlots.map((group) => (
                    <div className="list-item" key={group.date}>
                      <strong>{group.day}, {group.date}</strong>
                      <div className="inline-actions wrap" style={{ marginTop: 8 }}>
                        {group.slots.length ? (
                          group.slots.map((slot) => (
                            <button
                              type="button"
                              className="btn-soft small"
                              key={slot.id}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  appointment_date: group.date,
                                  slot_start_time: slot.start_time,
                                }))
                              }
                            >
                              {slot.start_time} - {slot.end_time}
                            </button>
                          ))
                        ) : (
                          <span className="muted">No remaining slots</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label>
              Reason
              <input
                type="text"
                placeholder="e.g. follow-up, new symptoms"
                value={form.reason}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                required
              />
            </label>

            <button type="submit" className="btn-main small">
              Book appointment
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        <h3>
          {user?.role === "doctor"
            ? "Your schedule"
            : "Your appointments"}
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {user?.role === "patient" && <th>Doctor</th>}
                {user?.role === "doctor" && <th>Patient</th>}
                <th>When</th>
                <th>Reason</th>
                <th>Status</th>
                {user?.role === "doctor" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td
                    colSpan={user?.role === "doctor" ? 5 : 4}
                    className="muted"
                  >
                    No appointments found.
                  </td>
                </tr>
              )}

              {appointments.map((item) => (
                <tr key={item.appointment_id}>
                  {user?.role === "patient" && (
                    <td>{item.doctor_name || item.doctor_user_id}</td>
                  )}
                  {user?.role === "doctor" && (
                    <td>{item.patient_name || item.patient_user_id}</td>
                  )}
                  <td>{formatIslamabadDateTime(item.scheduled_at)}</td>
                  <td>{item.reason}</td>
                  <td>{statusLabel(item.status)}</td>
                  {user?.role === "doctor" && (
                    <td>
                      <div className="inline-actions">
                        {item.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="btn-ghost small"
                              onClick={() =>
                                updateStatus(item.appointment_id, "confirmed")
                              }
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="btn-ghost small"
                              onClick={() =>
                                updateStatus(item.appointment_id, "cancelled")
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {item.status === "confirmed" && (
                          <button
                            type="button"
                            className="btn-ghost small"
                            onClick={() =>
                              updateStatus(item.appointment_id, "completed")
                            }
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Appointments;
