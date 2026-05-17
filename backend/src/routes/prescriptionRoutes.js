const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// POST /api/prescriptions - Create the main prescription record
router.post('/', prescriptionController.createMasterPrescription);

// POST /api/prescriptions/medications - Add a medicine to the prescription
router.post('/medications', prescriptionController.addMedication);

// GET /api/prescriptions/patient/:patientId - View a patient's prescription history
router.get('/patient/:patientId', prescriptionController.getPrescriptions);

// GET /api/prescriptions/:prescriptionId/medications - View medicines for a specific prescription
router.get('/:prescriptionId/medications', prescriptionController.getMedications);

module.exports = router;