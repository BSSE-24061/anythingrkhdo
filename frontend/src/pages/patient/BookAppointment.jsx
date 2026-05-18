import { useEffect, useState } from 'react';
import { userApi, appointmentApi, availabilityApi } from '../../utils/apiHelper';
import { getStoredUser } from '../../utils/session';
import {
  createIslamabadDateTimeValue,
  formatIslamabadDateTime,
  getIslamabadDateValue,
  getIslamabadTimeValue,
  getIslamabadWeekday,
} from '../../utils/dateTime';

const BookAppointment = () => {
  const user = getStoredUser();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');

  const toLocalDateValue = (value) => {
    return getIslamabadDateValue(value);
  };

  // Generate the next 30 upcoming dates starting from tomorrow
  const getUpcomingDates = () => {
    const dates = [];
    const todayValue = getIslamabadDateValue(new Date());
    const start = new Date(`${todayValue}T00:00:00+05:00`);
    
    for (let offset = 1; offset <= 30; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      const dateValue = getIslamabadDateValue(date);
      const weekday = getIslamabadWeekday(dateValue);
      dates.push({
        dateValue,
        weekday,
        formatted: new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date)
      });
    }
    return dates;
  };

  // Load all doctors
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setLoading(true);
        const response = await userApi.list();
        const allDoctors = Array.isArray(response.data)
          ? response.data.filter(u => u.role === 'doctor')
          : [];
        setDoctors(allDoctors);
      } catch (err) {
        setError('Failed to load doctors');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, []);

  const loadDoctorAvailability = async (doctorId) => {
    if (!doctorId) {
      setAvailableDates([]);
      setAvailableSlots([]);
      return;
    }

    try {
      setSlotLoading(true);
      setError('');
      
      const [availabilityResponse, appointmentsResponse] = await Promise.all([
        availabilityApi.getDoctor(doctorId),
        appointmentApi.byDoctor(doctorId),
      ]);
      
      const slots = availabilityResponse.data || [];
      const appointments = appointmentsResponse.data || [];

      const upcoming = getUpcomingDates();
      const validDates = [];

      for (const d of upcoming) {
        // Find slots matching this day of week
        const daySlots = slots.filter(slot => slot.day_of_week === d.weekday);
        if (daySlots.length === 0) continue;

        // Find existing appointments for this specific date
        const bookedStarts = new Set(
          appointments
            .filter((appointment) => appointment.status !== 'cancelled')
            .filter((appointment) => toLocalDateValue(appointment.scheduled_at) === d.dateValue)
            .map((appointment) => getIslamabadTimeValue(appointment.scheduled_at))
        );

        // Check if there is at least one slot that is NOT booked
        const unbookedSlots = daySlots.filter(
          slot => !bookedStarts.has(String(slot.start_time).slice(0, 5))
        );

        if (unbookedSlots.length > 0) {
          validDates.push({
            ...d,
            slots: unbookedSlots
          });
        }
      }

      setAvailableDates(validDates);
      if (validDates.length === 0) {
        setError('This doctor has no available slots in the next 30 days.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load doctor availability');
      setAvailableDates([]);
    } finally {
      setSlotLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError('Please select doctor, date, and time');
      return;
    }

    try {
      const scheduledIso = createIslamabadDateTimeValue(selectedDate, selectedTime);

      await appointmentApi.create({
        patient_user_id: user.id,
        doctor_user_id: selectedDoctor,
        scheduled_at: scheduledIso,
        appointment_date: selectedDate,
        slot_start_time: selectedTime,
        reason: reason || 'General Consultation',
      });

      setError('');
      alert(`Appointment booked for ${formatIslamabadDateTime(scheduledIso)}.`);
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      setReason('');
      setAvailableSlots([]);
      setAvailableDates([]);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to book appointment');
      console.error(err);
    }
  };

  if (loading) return <div><p>Loading doctors...</p></div>;

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Book an Appointment</h1>
          <p className="muted">Select a doctor and available time slot to schedule your appointment.</p>
        </div>
      </section>

      <section className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

        <div className="form-grid">
          <div>
            <label>Select Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => {
                const docId = e.target.value;
                setSelectedDoctor(docId);
                setSelectedDate('');
                setSelectedTime('');
                setAvailableSlots([]);
                loadDoctorAvailability(docId);
              }}
            >
              <option value="">Choose a doctor ({doctors.length} available)</option>
              {doctors.map(doc => (
                <option key={doc.user_id} value={doc.user_id}>
                  {doc.full_name} - {doc.specialization || 'General'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Select Date</label>
            <select
              value={selectedDate}
              onChange={(e) => {
                const dateVal = e.target.value;
                setSelectedDate(dateVal);
                setSelectedTime('');
                if (dateVal) {
                  const dateObj = availableDates.find(d => d.dateValue === dateVal);
                  setAvailableSlots(dateObj ? dateObj.slots : []);
                } else {
                  setAvailableSlots([]);
                }
              }}
              disabled={!selectedDoctor || slotLoading}
            >
              <option value="">
                {slotLoading ? 'Loading available dates...' : selectedDoctor ? 'Choose a date' : 'Please select a doctor first'}
              </option>
              {availableDates.map((d) => (
                <option key={d.dateValue} value={d.dateValue}>
                  {d.formatted}
                </option>
              ))}
            </select>
          </div>

          {selectedDoctor && selectedDate && (
            <div>
              <label>Select Time</label>
              {availableSlots.length > 0 ? (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  <option value="">Choose a time slot</option>
                  {availableSlots.map((slot, idx) => (
                    <option key={idx} value={slot.start_time}>
                      {slot.start_time} - {slot.end_time}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="muted">No available slots for this date</p>
              )}
            </div>
          )}

          <div>
            <label>Reason for Visit</label>
            <input
              placeholder="e.g., General checkup"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            onClick={handleBook}
            className="btn-main"
            disabled={!selectedDoctor || !selectedDate || !selectedTime}
          >
            Book Appointment
          </button>
        </div>
      </section>
    </>
  );
};

export default BookAppointment;
