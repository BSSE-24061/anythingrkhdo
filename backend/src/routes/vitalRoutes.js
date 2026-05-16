const express = require('express');
const router = express.Router();
const vitalController = require('../controllers/vitalController');
const auth = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(auth);

// POST /api/vitals - Log new patient vitals (auth required)
router.post('/', vitalController.addVitalLog);

// GET /api/vitals/patient/:patientId - Get history of vitals (auth required)
router.get('/patient/:patientId', vitalController.getVitals);

// GET /api/vitals/alerts/:patientId - Get all active alerts for a patient (auth required)
router.get('/alerts/:patientId', vitalController.getAlerts);

module.exports = router;