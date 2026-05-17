const Prescription = require("../models/prescriptionModel");
const History = require("../models/historyModel"); // <-- NEW: We bring in the History model!
const Medication = require("../models/medicationModel");
const { DOSE_SLOTS, isValidDosePeriod } = require("../constants/doseSlots");

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildScheduledTime = (date, period) => {
  const slot = DOSE_SLOTS[period];
  if (!slot) return null;

  const [hours, minutes] = slot.time.split(":").map(Number);
  const scheduled = new Date(date);
  scheduled.setHours(hours, minutes, 0, 0);
  return scheduled;
};

const eachScheduleDate = (startDate, endDate) => {
  const start = parseDateOnly(startDate) || new Date();
  start.setHours(0, 0, 0, 0);

  let end = parseDateOnly(endDate);
  if (!end) {
    end = new Date(start);
    end.setDate(end.getDate() + 29);
  }
  end.setHours(0, 0, 0, 0);

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const normalizeDosageSchedule = (dosageSchedule) => {
  if (!dosageSchedule || typeof dosageSchedule !== "object") return [];

  return Object.entries(dosageSchedule)
    .map(([period, dosage]) => ({
      period,
      dosage: String(dosage || "").trim(),
    }))
    .filter((item) => isValidDosePeriod(item.period) && item.dosage);
};

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
};

// 2. Add a Medication to an existing Prescription
const addMedication = async (req, res) => {
  try {
    const {
      prescription_id,
      patient_user_id,
      medication_id,
      dosage,
      frequency,
      dosage_schedule,
      start_date,
      end_date,
    } = req.body;

    const schedule = normalizeDosageSchedule(dosage_schedule);
    const primaryDosage =
      dosage ||
      schedule.map((item) => `${DOSE_SLOTS[item.period].label}: ${item.dosage}`).join(", ");
    const derivedFrequency =
      frequency ||
      schedule.map((item) => DOSE_SLOTS[item.period].label).join(", ");

    if (
      !prescription_id ||
      !patient_user_id ||
      !medication_id ||
      !primaryDosage ||
      (schedule.length === 0 && !frequency)
    ) {
      return res
        .status(400)
        .json({ error: "Select at least one dose timing and dosage" });
    }

    const newMedication = await Prescription.addPatientMedication({
      ...req.body,
      dosage: primaryDosage,
      frequency: derivedFrequency,
      dosage_schedule: schedule.reduce((current, item) => ({
        ...current,
        [item.period]: item.dosage,
      }), {}),
    });

    try {
      if (schedule.length > 0) {
        const dates = eachScheduleDate(start_date, end_date);
        for (const date of dates) {
          for (const item of schedule) {
            await Medication.createMedicationLog({
              patient_medication_id: newMedication.patient_medication_id,
              patient_user_id,
              scheduled_time: buildScheduledTime(date, item.period),
              dose_period: item.period,
              dose_dosage: item.dosage,
              status: "pending",
            });
          }
        }
      } else {
        await Medication.createMedicationLog({
          patient_medication_id: newMedication.patient_medication_id,
          patient_user_id,
          scheduled_time: start_date ? new Date(start_date) : new Date(),
          status: "pending",
        });
      }
    } catch (logError) {
      // Log creation is non-critical, don't fail the entire request
      console.warn(
        "Warning: Could not create medication schedule logs:",
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
};

// 3. Get all prescriptions for a patient
const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.getPatientPrescriptions(
      req.params.patientId,
    );
    res.status(200).json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 4. Get medications for a specific prescription
const getMedications = async (req, res) => {
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
