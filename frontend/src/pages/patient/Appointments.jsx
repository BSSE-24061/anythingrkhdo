import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  appointmentApi,
  availabilityApi,
  userApi,
  chatApi,
  getErrorMessage,
} from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import {
  formatIslamabadDateTime,
  createIslamabadDateTimeIso,
  createIslamabadDateTimeValue,
  getIslamabadDateValue,
  getIslamabadTimeValue,
  getIslamabadWeekday,
} from "../../utils/dateTime";

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

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const rangesOverlap = (startA, endA, startB, endB) =>
  startA < endB && endA > startB;

const isFutureSlot = (dateValue, timeValue) => {
  const iso = createIslamabadDateTimeIso(dateValue, timeValue);
  return iso && new Date(iso).getTime() > Date.now();
};

const pillForStatus = (status) => {
  const normalized = statusLabel(status);
  if (normalized === "confirmed")
    return { background: "rgba(37, 99, 235, 0.10)", color: "#2563eb" };
  if (normalized === "pending")
    return { background: "rgba(245, 158, 11, 0.14)", color: "#b45309" };
  if (normalized === "completed")
    return { background: "rgba(34, 197, 94, 0.14)", color: "#15803d" };
  if (normalized === "rejected")
    return { background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" };

  return { background: "rgba(148, 163, 184, 0.18)", color: "#475569" };
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

  const [tab, setTab] = useState("upcoming"); // all | upcoming | completed | cancelled
  const [bookingOpen, setBookingOpen] = useState(false);

  const [form, setForm] = useState({
    doctor_user_id: "",
    appointment_date: "",
    slot_start_time: "",
    reason: "",
    duration_minutes: 30,
  });

  const toLocalDateValue = (value) => getIslamabadDateValue(value);

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

  // Load doctors for patient
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

  // Load slots for selected doctor/date
  useEffect(() => {
    const loadSlots = async () => {
      if (
        user?.role !== "patient" ||
        !form.doctor_user_id ||
        !form.appointment_date
      ) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setError("");

      try {
        const [availabilityResponse, appointmentsResponse] = await Promise.all(
          [
            availabilityApi.getDoctor(form.doctor_user_id),
            appointmentApi.byDoctor(form.doctor_user_id),
          ],
        );

        const selectedDay = getIslamabadWeekday(form.appointment_date);

        const bookedRanges = (appointmentsResponse.data || [])
          .filter((appointment) => appointment.status !== "cancelled")
          .filter(
            (appointment) =>
              toLocalDateValue(appointment.scheduled_at) ===
              form.appointment_date,
          )
          .map((appointment) => {
            const start = timeToMinutes(
              getIslamabadTimeValue(appointment.scheduled_at),
            );
            const duration =
              Number(appointment.duration_minutes) || 30;
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

  // Load remaining slots this week (for patient UX)
  useEffect(() => {
    const loadWeekSlots = async () => {
      if (user?.role !== "patient" || !form.doctor_user_id) {
        setWeekSlots([]);
        return;
      }

      try {
        const [availabilityResponse, appointmentsResponse] = await Promise.all(
          [
            availabilityApi.getDoctor(form.doctor_user_id),
            appointmentApi.byDoctor(form.doctor_user_id),
          ],
        );

        const availability = availabilityResponse.data || [];
        const appointmentsData = appointmentsResponse.data || [];

        const groupedSlots = getNextSevenDays().map(({ date, day }) => {
          const bookedRanges = appointmentsData
            .filter((appointment) => appointment.status !== "cancelled")
            .filter(
              (appointment) => toLocalDateValue(appointment.scheduled_at) === date,
            )
            .map((appointment) => {
              const start = timeToMinutes(
                getIslamabadTimeValue(appointment.scheduled_at),
              );
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
          ? createIslamabadDateTimeValue(
              form.appointment_date,
              form.slot_start_time,
            )
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
        `Appointment booked for ${formatIslamabadDateTime(scheduledIso)}.`,
      );
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not complete booking — check selections and datetime."),
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

  const filteredAppointments = useMemo(() => {
    if (user?.role !== "patient") return appointments;

    const mapped = appointments.map((a) => ({
      ...a,
      _status: statusLabel(a.status),
    }));

    if (tab === "all") return mapped;
    if (tab === "upcoming") return mapped.filter((a) => a._status === "pending" || a._status === "confirmed");
    if (tab === "completed") return mapped.filter((a) => a._status === "completed");
    if (tab === "cancelled") return mapped.filter((a) => a._status === "rejected" || a._status === "cancelled");

    return mapped;
  }, [appointments, tab, user?.role]);

  if (!user) return null;

  // For doctor: keep existing table view (not the focus of your screenshot)
  const showDoctorTable = user?.role === "doctor";

  return (
    <div className="content-page" style={{ gap: 18 }}>
        {/* Header / Create Form */}
        <section className="panel">
          <p className="eyebrow">Scheduling</p>
          <h2 style={{ marginTop: 4 }}>Appointments</h2>
          <p className="muted">
            {user.role === "doctor"
              ? "Review your schedule and update visit status."
              : "Book with a verified doctor or browse specializations to match the right specialist."}
          </p>

          {user.role === "patient" && (
            <p className="muted" style={{ marginTop: 8 }}>
              Prefer to pick by specialty?{" "}
              <Link to="/specializations" style={{ color: "var(--accent)", fontWeight: 800 }}>
                Browse specializations
              </Link>{" "}
              or{" "}
              <Link to="/consultant" style={{ color: "var(--accent)", fontWeight: 800 }}>
                talk to a consultant
              </Link>{" "}
              if you are unsure who to see.
            </p>
          )}

          {error && <p className="error-text">{error}</p>}
          {success && <p className="alert alert-success">{success}</p>}

          {user.role === "patient" && (
            <>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-main"
                  onClick={() => setBookingOpen(true)}
                >
                  + Book New Appointment
                </button>
              </div>

              {bookingOpen && (
                <div
                  role="dialog"
                  aria-modal="true"
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.45)",
                    display: "grid",
                    placeItems: "center",
                    padding: 16,
                    zIndex: 1000,
                  }}
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setBookingOpen(false);
                  }}
                >
                  <div
                    style={{
                      width: "min(820px, 100%)",
                      background: "#ffffff",
                      borderRadius: 18,
                      border: "1px solid #e6edf5",
                      boxShadow: "0 18px 50px rgba(2,6,23,0.25)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px 18px",
                        borderBottom: "1px solid #e6edf5",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 950, color: "#0b0b0b" }}>
                          Book New Appointment
                        </div>
                        <div style={{ marginTop: 4, color: "#6b7280", fontWeight: 700, fontSize: 13 }}>
                          Select doctor, date, time slot, and reason.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-ghost small"
                        style={{ borderRadius: 12 }}
                        onClick={() => setBookingOpen(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={(e) => { createAppointment(e); setBookingOpen(false); }} style={{ padding: 18 }}>
                      <div style={{ display: "grid", gap: 14 }}>
                        <label style={{ display: "grid", gap: 8 }}>
                          <div style={{ fontWeight: 950, color: "#0b0b0b" }}>Select Doctor</div>
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
                            disabled={loadingDoctors}
                            style={{ width: "100%" }}
                          >
                            <option value="">
                              {loadingDoctors ? "Loading doctors..." : "Choose a doctor"}
                            </option>
                            {doctors.map((doc) => (
                              <option key={doc.user_id} value={doc.user_id}>
                                {doc.full_name}
                                {doc.specialization ? ` — ${doc.specialization}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                          <label style={{ display: "grid", gap: 8 }}>
                            <div style={{ fontWeight: 950, color: "#0b0b0b" }}>Date</div>
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

                          <label style={{ display: "grid", gap: 8 }}>
                            <div style={{ fontWeight: 950, color: "#0b0b0b" }}>Time Slot</div>
                            <select
                              value={form.slot_start_time}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, slot_start_time: e.target.value }))
                              }
                              required
                              disabled={!form.doctor_user_id || !form.appointment_date || loadingSlots}
                            >
                              <option value="">
                                {loadingSlots ? "Loading slots..." : "Select a time slot"}
                              </option>
                              {availableSlots.map((slot) => (
                                <option key={slot.availability_id} value={slot.start_time}>
                                  {slot.start_time} - {slot.end_time}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label style={{ display: "grid", gap: 8 }}>
                          <div style={{ fontWeight: 950, color: "#0b0b0b" }}>
                            Reason for Visit
                          </div>
                          <input
                            type="text"
                            placeholder="Describe your symptoms or reason for appointment..."
                            value={form.reason}
                            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                            required
                            style={{ width: "100%" }}
                          />
                        </label>

                        {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
                        {success && <p className="alert alert-success" style={{ margin: 0 }}>{success}</p>}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 12,
                          marginTop: 18,
                          paddingTop: 14,
                          borderTop: "1px solid #e6edf5",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-ghost small"
                          onClick={() => setBookingOpen(false)}
                        >
                          Cancel
                        </button>

                        <button type="submit" className="btn-main small">
                          Confirm Booking
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Appointments View */}
        <section className="panel">
          {!showDoctorTable && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                {[
                  { key: "all", label: "All" },
                  { key: "upcoming", label: "Upcoming" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled" },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={tab === t.key ? "btn-main small" : "btn-ghost small"}
                    style={{
                      paddingInline: 18,
                      ...(tab === t.key
                        ? { background: "var(--accent)", borderColor: "transparent" }
                        : { borderColor: "var(--line)" }),
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDoctorTable ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>When</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">
                        No appointments found.
                      </td>
                    </tr>
                  )}
                  {appointments.map((item) => (
                    <tr key={item.appointment_id}>
                      <td>{item.patient_name || item.patient_user_id}</td>
                      <td>{formatIslamabadDateTime(item.scheduled_at)}</td>
                      <td>{item.reason}</td>
                      <td>{statusLabel(item.status)}</td>
                      <td>
                        <div className="inline-actions">
                          {item.status === "pending" && (
                            <>
                              <button
                                type="button"
                                className="btn-ghost small"
                                onClick={() => updateStatus(item.appointment_id, "confirmed")}
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                className="btn-ghost small"
                                onClick={() => updateStatus(item.appointment_id, "cancelled")}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {item.status === "confirmed" && (
                            <>
                              <Link
                                to={`/chat?room=${item.patient_user_id}`}
                                className="btn-main small"
                                style={{ paddingInline: 18, textDecoration: "none", display: "inline-grid", placeItems: "center" }}
                              >
                                Chat
                              </Link>
                              <button
                                type="button"
                                className="btn-ghost small"
                                onClick={() => updateStatus(item.appointment_id, "completed")}
                              >
                                Mark Done
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              {filteredAppointments.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", color: "#6b7280", fontWeight: 800 }}>
                  No appointments for this filter.
                </div>
              ) : (
                filteredAppointments.map((item) => {
                  const pill = pillForStatus(item.status);
                  return (
                    <div
                      key={item.appointment_id}
                      style={{
                        border: "1px solid var(--line)",
                        borderRadius: 16,
                        padding: 14,
                        background: "#ffffff",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 999,
                              background: "rgba(37, 99, 235, 0.08)",
                              border: "1px solid rgba(37, 99, 235, 0.22)",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 900,
                              color: "#2563eb",
                              flex: "0 0 auto",
                            }}
                          >
                            👤
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: "#0b0b0b", fontWeight: 950 }}>
                              {item.doctor_name || item.doctor_user_id}
                            </div>
                            <div style={{ color: "#6b7280", fontWeight: 800, fontSize: 12, marginTop: 4 }}>
                              {item.specialization || "Doctor"}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontWeight: 950,
                            fontSize: 11,
                            background: pill.background,
                            color: pill.color,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {statusLabel(item.status)}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div style={{ color: "#0b0b0b", fontWeight: 900 }}>
                            📅 {formatIslamabadDateTime(item.scheduled_at)}
                          </div>
                          <div style={{ color: "#6b7280", fontWeight: 800, fontSize: 13 }}>
                            Reason
                            <div style={{ color: "#0b0b0b", fontWeight: 950, marginTop: 4 }}>
                              {item.reason || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                        <button
                          type="button"
                          className="btn-ghost small"
                          style={{ borderColor: "var(--line)", paddingInline: 18 }}
                          onClick={() => alert(`Appointment Details:\nDoctor: ${item.doctor_name || item.doctor_user_id}\nDate: ${formatIslamabadDateTime(item.scheduled_at)}\nReason: ${item.reason}\nStatus: ${item.status}`)}
                        >
                          View Details
                        </button>
                        {(item.status === "pending" || item.status === "confirmed") && (
                          <>
                            <Link
                              to={`/chat?room=${item.doctor_user_id}`}
                              className="btn-main small"
                              style={{ paddingInline: 18, textDecoration: "none", display: "inline-grid", placeItems: "center" }}
                            >
                              Chat
                            </Link>
                            <button
                              type="button"
                              className="btn-ghost small"
                              style={{ borderColor: "var(--danger)", color: "var(--danger)", paddingInline: 18 }}
                              onClick={() => {
                                if (window.confirm("Are you sure you want to cancel this appointment?")) {
                                  updateStatus(item.appointment_id, "cancelled");
                                }
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
  );
};

export default Appointments;
