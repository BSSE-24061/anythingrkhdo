import { useCallback, useEffect, useState } from "react";
import { availabilityApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import {
  getUpcomingDateForWeekday,
  getCurrentIslamabadTime,
  getCurrentIslamabadDate,
  getIslamabadWeekday,
} from "../../utils/dateTime";

const getAvailableWeekdays = () => [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const Availability = () => {
  const user = getStoredUser();
  const daysOfWeek = getAvailableWeekdays();

  const [savedSlots, setSavedSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    day_of_week: daysOfWeek[0],
    start_time: "09:00",
    end_time: "09:30",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timeToMinutes = (time) => {
    const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  };

  const validateNewSlot = () => {
    const start = timeToMinutes(newSlot.start_time);
    const end = timeToMinutes(newSlot.end_time);

    if (end <= start) return "End time must be after start time";
    if (start % 30 !== 0 || end % 30 !== 0) {
      return "Start and end times must be on 30-minute boundaries";
    }
    if (end - start !== 30) return "Each slot must be exactly 30 minutes";

    // Check if trying to add a slot for today that has already passed
    const today = getCurrentIslamabadDate();
    const todayWeekday = getIslamabadWeekday(today);
    const currentTime = getCurrentIslamabadTime();
    const currentMinutes = timeToMinutes(currentTime);

    if (newSlot.day_of_week === todayWeekday && start <= currentMinutes) {
      return "Cannot add slots for times that have already passed today";
    }

    const sameDaySlots = savedSlots.filter(
      (slot) => slot.day_of_week === newSlot.day_of_week,
    );
    const overlaps = sameDaySlots.some((slot) => {
      const savedStart = timeToMinutes(slot.start_time);
      const savedEnd = timeToMinutes(slot.end_time);
      return start < savedEnd && end > savedStart;
    });
    if (overlaps) return "Availability slots cannot overlap";

    const totalForDay = sameDaySlots.reduce(
      (total, slot) =>
        total + timeToMinutes(slot.end_time) - timeToMinutes(slot.start_time),
      0,
    );
    if (totalForDay + end - start > 8 * 60) {
      return "Total duty time for a day cannot exceed 8 hours";
    }

    return "";
  };

  // Load availability from server
  const loadAvailability = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await availabilityApi.getDoctor(user.id);
      setSavedSlots(response.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const addSlot = async () => {
    try {
      if (!newSlot.day_of_week || !newSlot.start_time || !newSlot.end_time) {
        setError("Please fill in all fields");
        return;
      }

      const validationError = validateNewSlot();
      if (validationError) {
        setError(validationError);
        return;
      }

      await availabilityApi.addSlot(newSlot);
      setNewSlot({
        day_of_week: daysOfWeek[0],
        start_time: "09:00",
        end_time: "09:30",
      });
      setError("");
      await loadAvailability();
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Response data:", err?.response?.data);
      const errorMessage =
        err?.response?.data?.error || err?.message || "Failed to add slot";
      setError(errorMessage);
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await availabilityApi.removeSlot(slotId);
      await loadAvailability();
    } catch (err) {
      console.error(err);
      setError("Failed to delete slot");
    }
  };

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Doctor Availability</h1>
          <p className="muted">
            Set your available appointment slots so patients can book when
            you're available.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <h3>Add New Availability Slot</h3>
        </div>
        <p className="muted">
          Slots are weekly duty slots. Patients can book only matching real
          dates and remaining times.
        </p>

        {error && <p style={{ color: "red", marginBottom: 12 }}>{error}</p>}

        <div className="form-grid doctor-compact-form">
          <label>
            Weekday
            <select
              value={newSlot.day_of_week}
              onChange={(e) =>
                setNewSlot({ ...newSlot, day_of_week: e.target.value })
              }
            >
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {day}
                  {getUpcomingDateForWeekday(day)
                    ? `, ${getUpcomingDateForWeekday(day)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label>
            Start Time
            <input
              type="time"
              step="1800"
              value={newSlot.start_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, start_time: e.target.value })
              }
            />
          </label>

          <label>
            End Time
            <input
              type="time"
              step="1800"
              value={newSlot.end_time}
              onChange={(e) =>
                setNewSlot({ ...newSlot, end_time: e.target.value })
              }
            />
          </label>

          <button onClick={addSlot} className="btn-main">
            Add Slot
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <h3>Your Availability Slots</h3>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : savedSlots.length ? (
          <div className="list-stack">
            {savedSlots.map((slot) => (
              <div className="list-item" key={slot.availability_id}>
                <strong>
                  {slot.day_of_week}
                  {getUpcomingDateForWeekday(slot.day_of_week)
                    ? `, ${getUpcomingDateForWeekday(slot.day_of_week)}`
                    : ""}
                </strong>
                <span>
                  {slot.start_time} - {slot.end_time}
                </span>
                <button
                  className="btn-soft small"
                  onClick={() => deleteSlot(slot.availability_id)}
                  style={{ marginTop: 8 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            No availability slots set yet. Add some to get started!
          </p>
        )}
      </section>
    </>
  );
};

export default Availability;
