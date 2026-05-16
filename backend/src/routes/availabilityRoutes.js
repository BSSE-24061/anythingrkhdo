const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const auth = require('../middlewares/auth');

// Apply auth middleware to all write operations first
router.post('/', auth, availabilityController.setAvailability);
router.post('/slots', auth, availabilityController.addSlot);
router.delete('/slots/:slotId', auth, availabilityController.removeSlot);

// GET /api/availability/:doctorId - Get availability for a specific doctor (public, no auth needed)
router.get('/:doctorId', availabilityController.getAvailability);

module.exports = router;
