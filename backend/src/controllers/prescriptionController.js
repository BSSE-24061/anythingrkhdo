<<<<<<< HEAD
const Prescription = require("../models/prescriptionModel");
const History = require("../models/historyModel"); // <-- NEW: We bring in the History model!
const Medication = require("../models/medicationModel");

// 1. Create the Master Prescription (The Diagnosis)
const createMasterPrescription = async (req, res) => {
  try {
    const { patient_user_id, doctor_user_id, diagnosis } = req.body;

    if (!patient_user_id || !doctor_user_id || !diagnosis) {
      return res
        .status(400)
        .json({ error: "Patient ID, Doctor ID, and Diagnosis are required" });
    }

    // 1. Create the prescription in the database
    const newPrescription = await Prescription.createPrescription(req.body);

    // 2. NEW: AUTOMATICALLY log it to the history timeline!
    await History.addHistoryEvent({
      patient_user_id: patient_user_id,
      event_type: "Prescription Added",
      title: `Doctor prescribed treatment for: ${diagnosis}`,
      added_by: doctor_user_id,
      related_prescription_id: newPrescription.prescription_id,
    });

    res.status(201).json({
      message: "Prescription created and logged to history successfully",
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("Error creating prescription:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
=======
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
>>>>>>> parent of 42a0ed9 (push)
};

// 2. Add a Medication to an existing Prescription
const addMedication = async (req, res) => {
<<<<<<< HEAD
  try {
    const {
      prescription_id,
      patient_user_id,
      medication_id,
      dosage,
      frequency,
      start_date,
      end_date,
    } = req.body;

    if (
      !prescription_id ||
      !patient_user_id ||
      !medication_id ||
      !dosage ||
      !frequency
    ) {
      return res
        .status(400)
        .json({ error: "Missing required medication details" });
    }

    const newMedication = await Prescription.addPatientMedication(req.body);

    // Create an initial medication log entry for the patient to see the medication
    // This allows the medication to appear in the patient's dashboard immediately
    try {
      await Medication.createMedicationLog({
        patient_medication_id: newMedication.patient_medication_id,
        patient_user_id: patient_user_id,
        scheduled_time: start_date ? new Date(start_date) : new Date(),
        status: "pending",
      });
    } catch (logError) {
      // Log creation is non-critical, don't fail the entire request
      console.warn(
        "Warning: Could not create initial medication log:",
        logError.message,
      );
    }

    res.status(201).json({
      message: "Medication added to prescription",
      medication: newMedication,
    });
  } catch (error) {
    console.error("Error adding medication:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
=======
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
>>>>>>> parent of 42a0ed9 (push)
};

// 3. Get all prescriptions for a patient
const getPrescriptions = async (req, res) => {
<<<<<<< HEAD
  try {
    const prescriptions = await Prescription.getPatientPrescriptions(
      req.params.patientId,
    );
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
=======
    try {
        const prescriptions = await Prescription.getPatientPrescriptions(req.params.patientId);
        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Error fetching prescriptions:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
>>>>>>> parent of 42a0ed9 (push)
};

// 4. Get medications for a specific prescription
const getMedications = async (req, res) => {
<<<<<<< HEAD
  try {
    const medications = await Prescription.getMedicationsByPrescription(
      req.params.prescriptionId,
    );
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
  getMedications,
};
=======
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
>>>>>>> parent of 42a0ed9 (push)
