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
  const [slotLoading, setSlotLoading] = useState(false);
  const [error, setError] = useState('');

  const toLocalDateValue = (value) => {
    return getIslamabadDateValue(value);
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

  // Load availability when doctor is selected or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const loadAvailableSlots = async () => {
    try {
      setSlotLoading(true);
      const [availabilityResponse, appointmentsResponse] = await Promise.all([
        availabilityApi.getDoctor(selectedDoctor),
        appointmentApi.byDoctor(selectedDoctor),
      ]);
      const slots = availabilityResponse.data || [];

      const dayName = getIslamabadWeekday(selectedDate);

      const bookedStarts = new Set(
        (appointmentsResponse.data || [])
          .filter((appointment) => appointment.status !== 'cancelled')
          .filter((appointment) => toLocalDateValue(appointment.scheduled_at) === selectedDate)
          .map((appointment) => getIslamabadTimeValue(appointment.scheduled_at))
      );

      // Filter slots for this day of week and remove slots that are already booked
      const todaysSlots = slots
        .filter(slot => slot.day_of_week === dayName)
        .filter(slot => !bookedStarts.has(String(slot.start_time).slice(0, 5)));
      setAvailableSlots(todaysSlots);

      if (todaysSlots.length === 0) {
        setError(`Doctor is not available on ${dayName}s`);
      } else {
        setError('');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load availability');
      setAvailableSlots([]);
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
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to book appointment');
      console.error(err);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
                setSelectedDoctor(e.target.value);
                setSelectedTime('');
                setAvailableSlots([]);
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
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
            />
          </div>

          {selectedDoctor && selectedDate && (
            <div>
              <label>Select Time</label>
              {slotLoading ? (
                <p className="muted">Loading available times...</p>
              ) : availableSlots.length > 0 ? (
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
