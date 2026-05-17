const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const auth = require('../middlewares/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET /api/history/patient/:patientId - View the timeline (auth required)
router.get('/patient/:patientId', historyController.getHistory);

// POST /api/history - Manually log a new timeline event (auth required)
router.post('/', historyController.addEvent);

module.exports = router;