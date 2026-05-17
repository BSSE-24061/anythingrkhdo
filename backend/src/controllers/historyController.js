const History = require('../models/historyModel');

// 1. Fetch the patient's timeline
const getHistory = async (req, res) => {
    try {
        const history = await History.getPatientHistory(req.params.patientId);
        res.status(200).json(history);
    } catch (error) {
        console.error("Error fetching medical history:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. Manually add an event to the timeline
const addEvent = async (req, res) => {
    try {
        const { patient_user_id, event_type, title } = req.body;

        // Get the user role from the request (should be set by auth middleware)
        const userRole = req.user?.role || req.body.user_role;
        
        // Doctors cannot add events - only patients or admins can
        if (userRole === "doctor") {
            return res.status(403).json({ error: "Doctors cannot add or modify patient medical history" });
        }

        if (!patient_user_id || !event_type || !title) {
            return res.status(400).json({ error: "Patient ID, Event Type, and Title are required" });
        }

        const newEvent = await History.addHistoryEvent(req.body);
        res.status(201).json({ message: "History event added", event: newEvent });

    } catch (error) {
        console.error("Error adding history event:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    getHistory,
    addEvent
};