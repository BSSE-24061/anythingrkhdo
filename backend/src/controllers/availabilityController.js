const Availability = require('../models/availabilityModel');

const MAX_DUTY_MINUTES_PER_DAY = 8 * 60;
const APPOINTMENT_MINUTES = 30;
const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const timeToMinutes = (time) => {
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const validateSlot = (slot) => {
  if (!validDays.includes(slot.day_of_week)) {
    return 'Invalid day of week';
  }
  if (!slot.start_time || !slot.end_time) {
    return 'Each slot must have start_time and end_time';
  }

  const startMinutes = timeToMinutes(slot.start_time);
  const endMinutes = timeToMinutes(slot.end_time);
  if (startMinutes === null || endMinutes === null) {
    return 'Invalid slot time';
  }
  if (endMinutes <= startMinutes) {
    return 'End time must be after start time';
  }
  if (startMinutes % APPOINTMENT_MINUTES !== 0 || endMinutes % APPOINTMENT_MINUTES !== 0) {
    return 'Availability must start and end on 30-minute boundaries';
  }
  if (endMinutes - startMinutes !== APPOINTMENT_MINUTES) {
    return 'Each availability slot must be exactly 30 minutes';
  }

  return null;
};

// Get availability for a specific doctor
const getAvailability = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const slots = await Availability.getDoctorAvailability(doctorId);
    res.status(200).json(slots);
  } catch (error) {
    console.error('Error fetching availability:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Set availability for the logged-in doctor
const setAvailability = async (req, res) => {
  try {
    const { slots } = req.body;
    const doctorId = req.user.id; // From auth middleware

    // Validate slots format
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Slots must be a non-empty array' });
    }

    for (const slot of slots) {
      const validationError = validateSlot(slot);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
    }

    const totalsByDay = slots.reduce((totals, slot) => {
      const startMinutes = timeToMinutes(slot.start_time);
      const endMinutes = timeToMinutes(slot.end_time);
      totals[slot.day_of_week] = (totals[slot.day_of_week] || 0) + (endMinutes - startMinutes);
      return totals;
    }, {});

    for (const [day, totalMinutes] of Object.entries(totalsByDay)) {
      if (totalMinutes > MAX_DUTY_MINUTES_PER_DAY) {
        return res.status(400).json({ error: `Duty time for ${day} cannot exceed 8 hours` });
      }
    }

    const sortedSlots = [...slots].sort((a, b) =>
      a.day_of_week.localeCompare(b.day_of_week) || timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );
    for (let index = 1; index < sortedSlots.length; index += 1) {
      const previous = sortedSlots[index - 1];
      const current = sortedSlots[index];
      if (
        previous.day_of_week === current.day_of_week &&
        timeToMinutes(previous.end_time) > timeToMinutes(current.start_time)
      ) {
        return res.status(400).json({ error: 'Availability slots cannot overlap' });
      }
    }

    const savedSlots = await Availability.setDoctorAvailability(doctorId, slots);
    res.status(201).json({ 
      message: 'Availability updated successfully', 
      slots: savedSlots 
    });
  } catch (error) {
    console.error('Error setting availability:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Add a single availability slot
const addSlot = async (req, res) => {
  try {
    const { day_of_week, start_time, end_time } = req.body;
    const doctorId = req.user?.id;

    // Better error messages for debugging
    if (!doctorId) {
      console.error('Error: doctorId is missing. req.user:', req.user);
      return res.status(401).json({ error: 'Unauthorized: No user context' });
    }

    const validationError = validateSlot({ day_of_week, start_time, end_time });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const overlappingSlot = await Availability.getOverlappingAvailabilitySlot(
      doctorId,
      day_of_week,
      start_time,
      end_time
    );
    if (overlappingSlot) {
      return res.status(400).json({ error: 'Availability slots cannot overlap' });
    }

    const currentDutyMinutes = await Availability.getTotalDutyMinutesForDay(doctorId, day_of_week);
    const requestedMinutes = timeToMinutes(end_time) - timeToMinutes(start_time);
    if (currentDutyMinutes + requestedMinutes > MAX_DUTY_MINUTES_PER_DAY) {
      return res.status(400).json({ error: 'A doctor can set at most 8 hours of duty per day' });
    }

    console.log(`Adding slot for doctor ${doctorId}: ${day_of_week} ${start_time}-${end_time}`);

    const slot = await Availability.addAvailabilitySlot(doctorId, day_of_week, start_time, end_time);
    res.status(201).json({ message: 'Slot added', slot });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'This time slot already exists' });
    }
    console.error('Error adding slot:', error.message, error.code);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Remove a specific availability slot
const removeSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await Availability.removeAvailabilitySlot(slotId);
    
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    res.status(200).json({ message: 'Slot removed', slot });
  } catch (error) {
    console.error('Error removing slot:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAvailability,
  setAvailability,
  addSlot,
  removeSlot,
};
