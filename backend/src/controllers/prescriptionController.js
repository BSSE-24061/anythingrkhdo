const Prescription = require('../models/prescriptionModel');
const History = require('../models/historyModel'); // <-- NEW: We bring in the History model!

// 1. Create the Master Prescription (The Diagnosis)
const createMasterPrescription = async (req, res) => {
    try {
        const { patient_user_id, doctor_user_id, diagnosis } = req.body;

        if (!patient_user_id || !doctor_user_id || !diagnosis) {
            return res.status(400).json({ error: "Patient ID, Doctor ID, and Diagnosis are required" });
        }

        // 1. Create the prescription in the database
        const newPrescription = await Prescription.createPrescription(req.body);

        // 2. NEW: AUTOMATICALLY log it to the history timeline!
        await History.addHistoryEvent({
            patient_user_id: patient_user_id,
            event_type: 'Prescription Added',
            title: `Doctor prescribed treatment for: ${diagnosis}`,
            added_by: doctor_user_id,
            related_prescription_id: newPrescription.prescription_id
        });

        res.status(201).json({ 
            message: "Prescription created and logged to history successfully", 
            prescription: newPrescription 
        });

    } catch (error) {
        console.error("Error creating prescription:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. Add a Medication to an existing Prescription
const addMedication = async (req, res) => {
    try {
        const { prescription_id, patient_user_id, medication_id, dosage, frequency } = req.body;

        if (!prescription_id || !patient_user_id || !medication_id || !dosage || !frequency) {
            return res.status(400).json({ error: "Missing required medication details" });
        }

        const newMedication = await Prescription.addPatientMedication(req.body);
        res.status(201).json({ 
            message: "Medication added to prescription", 
            medication: newMedication 
        });

    } catch (error) {
        console.error("Error adding medication:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 3. Get all prescriptions for a patient
const getPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.getPatientPrescriptions(req.params.patientId);
        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Error fetching prescriptions:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 4. Get medications for a specific prescription
const getMedications = async (req, res) => {
    try {
        const medications = await Prescription.getMedicationsByPrescription(req.params.prescriptionId);
        res.status(200).json(medications);
    } catch (error) {
        console.error("Error fetching medications:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    createMasterPrescription,
    addMedication,
    getPrescriptions,
    getMedications
};