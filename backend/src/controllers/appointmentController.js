const Appointment = require('../models/appointmentModel');
const Availability = require('../models/availabilityModel');
const History = require('../models/historyModel'); // <-- NEW: Bring in the History model!
const Notification = require('../models/notificationModel');

const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Asia/Karachi';
const APP_TIME_ZONE_OFFSET = '+05:00';

const getAppointmentLocalParts = (scheduledAt) => {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) return null;

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: APP_TIME_ZONE,
    }).format(date);

    const startTime = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: APP_TIME_ZONE,
    }).format(date);

    const dateParts = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: APP_TIME_ZONE,
    }).formatToParts(date);
    const part = (type) => dateParts.find((entry) => entry.type === type)?.value;
    const dateValue = `${part('year')}-${part('month')}-${part('day')}`;

    return { date, dateValue, dayOfWeek, startTime };
};

const timeToMinutes = (time) => {
    const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    return hours * 60 + minutes;
};

const normalizeTime = (time) => String(time || '').slice(0, 5);

const getSelectedAppointmentParts = (dateValue, timeValue) => {
    const startTime = normalizeTime(timeValue);
    if (!dateValue || !startTime) return null;

    const date = new Date(`${dateValue}T${startTime}:00${APP_TIME_ZONE_OFFSET}`);
    if (Number.isNaN(date.getTime())) return null;

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: APP_TIME_ZONE,
    }).format(new Date(`${dateValue}T00:00:00${APP_TIME_ZONE_OFFSET}`));

    return { date, dateValue, dayOfWeek, startTime };
};

const formatAppointmentLocal = (scheduledAt) => {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) return 'selected date and time';

    return new Intl.DateTimeFormat('en-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: APP_TIME_ZONE,
    }).format(date);
};

const statusLabels = {
    pending: 'pending',
    confirmed: 'confirmed',
    completed: 'completed',
    cancelled: 'rejected',
};

// 1. Book a new appointment
const bookAppointment = async (req, res) => {
    try {
        const {
            patient_user_id,
            doctor_user_id,
            scheduled_at,
            appointment_date,
            slot_start_time,
            reason,
        } = req.body;

        if (!patient_user_id || !doctor_user_id || !scheduled_at) {
            return res.status(400).json({ error: "Patient ID, Doctor ID, and Schedule Date are required" });
        }

        const appointmentTime =
            getSelectedAppointmentParts(appointment_date, slot_start_time) ||
            getAppointmentLocalParts(scheduled_at);
        if (!appointmentTime) {
            return res.status(400).json({ error: "Invalid appointment date/time" });
        }

        if (appointmentTime.date.getTime() <= Date.now()) {
            return res.status(400).json({ error: "Appointment must be booked for a future date and time" });
        }

        if (appointment_date && appointment_date !== appointmentTime.dateValue) {
            return res.status(400).json({
                error: "Appointment date does not match the selected schedule time"
            });
        }

        if (slot_start_time && normalizeTime(slot_start_time) !== appointmentTime.startTime) {
            return res.status(400).json({
                error: "Appointment time does not match the selected slot"
            });
        }

        const duration = 30;
        if (timeToMinutes(appointmentTime.startTime) % 30 !== 0) {
            return res.status(400).json({ error: "Appointments must start on a 30-minute slot" });
        }

        const matchingSlot = await Availability.findMatchingAvailabilitySlot(
            doctor_user_id,
            appointmentTime.dayOfWeek,
            appointmentTime.startTime,
            duration
        );

        if (!matchingSlot) {
            return res.status(400).json({
                error: "Selected time is not in this doctor's available slots"
            });
        }

        const alreadyBooked = await Appointment.hasOverlappingBooking(
            doctor_user_id,
            patient_user_id,
            scheduled_at,
            duration
        );
        if (alreadyBooked) {
            return res.status(400).json({ error: "This slot overlaps with an existing appointment" });
        }

        const newAppointment = await Appointment.createAppointment({
            patient_user_id,
            doctor_user_id,
            scheduled_at,
            reason,
            duration_minutes: duration,
        });

        // NEW: AUTOMATICALLY log the booking to the history timeline!
        await History.addHistoryEvent({
            patient_user_id: patient_user_id,
            event_type: 'Appointment Booked',
            title: `Appointment scheduled for ${formatAppointmentLocal(scheduled_at)}`,
            description: reason || 'Consultation',
            added_by: patient_user_id,
            related_appointment_id: newAppointment.appointment_id,
            event_date: scheduled_at
        });

        res.status(201).json({ message: "Appointment booked successfully", appointment: newAppointment });

    } catch (error) {
        console.error("Error booking appointment:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. Get history for a specific patient
const getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.getPatientAppointments(req.params.patientId);
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching patient appointments:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 3. Get schedule for a specific doctor
const getDoctorAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.getDoctorAppointments(req.params.doctorId);
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Error fetching doctor appointments:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 4. Update status (e.g., Doctor marks it 'confirmed' or 'completed')
const updateStatus = async (req, res) => {
    try {
        const requestedStatus = req.body.status === 'rejected' ? 'cancelled' : req.body.status;
        const validStatuses = ['confirmed', 'completed', 'cancelled'];

        if (!validStatuses.includes(requestedStatus)) {
            return res.status(400).json({ error: "Invalid appointment status" });
        }

        const currentAppointment = await Appointment.getAppointmentById(req.params.id);
        if (!currentAppointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const allowedTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['completed', 'cancelled'],
            completed: [],
            cancelled: [],
        };

        if (!allowedTransitions[currentAppointment.status]?.includes(requestedStatus)) {
            return res.status(400).json({
                error: `Cannot change appointment from ${statusLabels[currentAppointment.status] || currentAppointment.status} to ${statusLabels[requestedStatus] || requestedStatus}`
            });
        }

        const updatedAppointment = await Appointment.updateStatus(req.params.id, requestedStatus);

        if (!updatedAppointment) {
            return res.status(404).json({ error: "Appointment not found" });
        }

        const appointmentWhen = formatAppointmentLocal(updatedAppointment.scheduled_at);
        if (requestedStatus === 'confirmed' || requestedStatus === 'cancelled') {
            // Create notification for patient
            await Notification.createNotification({
                user_id: updatedAppointment.patient_user_id,
                type: 'info',
                title: requestedStatus === 'confirmed' ? 'Appointment confirmed' : 'Appointment cancelled',
                body: requestedStatus === 'confirmed'
                    ? `Your appointment for ${appointmentWhen} has been confirmed.`
<<<<<<< HEAD
                    : `Your appointment for ${appointmentWhen} has been cancelled.`,
=======
                    : `Your appointment for ${appointmentWhen} has been cancelled by the doctor.`,
>>>>>>> parent of 42a0ed9 (push)
                reference_id: updatedAppointment.appointment_id,
                reference_type: 'appointment',
            });

            // If cancelling, also send notification to doctor
            if (requestedStatus === 'cancelled') {
                await Notification.createNotification({
                    user_id: updatedAppointment.doctor_user_id,
                    type: 'info',
                    title: 'Appointment cancelled',
                    body: `Appointment with ${updatedAppointment.patient_name || 'patient'} for ${appointmentWhen} has been cancelled.`,
                    reference_id: updatedAppointment.appointment_id,
                    reference_type: 'appointment',
                });
            }
        }

        // NEW: AUTOMATICALLY log the status change to the history timeline!
        await History.addHistoryEvent({
            patient_user_id: updatedAppointment.patient_user_id,
            event_type: 'Appointment Updated',
            title: `Appointment status changed to: ${statusLabels[requestedStatus] || requestedStatus}`,
            related_appointment_id: updatedAppointment.appointment_id,
            event_date: updatedAppointment.scheduled_at
        });

        res.status(200).json({ message: `Appointment status updated to ${statusLabels[requestedStatus] || requestedStatus}`, appointment: updatedAppointment });
    } catch (error) {
        console.error("Error updating status:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    bookAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateStatus
};
