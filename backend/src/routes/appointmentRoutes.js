const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// POST /api/appointments - Book a new appointment
router.post('/', appointmentController.bookAppointment);

// GET /api/appointments/patient/:patientId - View a patient's history
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

// GET /api/appointments/doctor/:doctorId - View a doctor's schedule
router.get('/doctor/:doctorId', appointmentController.getDoctorAppointments);

// PATCH /api/appointments/:id/status - Update the appointment status
router.patch('/:id/status', appointmentController.updateStatus);

module.exports = router;