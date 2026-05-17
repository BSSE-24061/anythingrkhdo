const Medication = require("../models/medicationModel");
const Notification = require("../models/notificationModel");
const Vital = require("../models/vitalModel");
const { DOSE_SLOTS } = require("../constants/doseSlots");

const formatDosePeriod = (period) => DOSE_SLOTS[period]?.label || "Scheduled";

const createMissedDoseAlerts = async (patientId) => {
  const missedLogs = await Medication.getUnalertedMissedMedicationLogs(patientId);

  for (const log of missedLogs) {
    const doseLabel = formatDosePeriod(log.dose_period);
    const medicationName = log.medication_name || "your medication";
    const dosageText = log.dose_dosage || log.dosage || "prescribed dose";

    try {
      await Notification.createNotification({
        user_id: log.patient_user_id,
        type: "alert",
        title: `${doseLabel} medication missed`,
        body: `You missed ${dosageText} of ${medicationName} for the ${doseLabel.toLowerCase()} dose.`,
        reference_id: log.log_id,
        reference_type: "medication_log",
      });

      await Vital.createAlert({
        patient_user_id: log.patient_user_id,
        vital_id: null,
        alert_type: "Missed Medication",
        message: `You missed ${dosageText} of ${medicationName} for the ${doseLabel.toLowerCase()} dose.`,
        severity: "medium",
      });

      await Medication.markMedicationLogAlertSent(log.log_id);
    } catch (error) {
      console.error("Error creating missed medication alert:", error.message);
    }
  }
};

const getMedications = async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const medications = await Medication.getAllMedications(status);
    res.status(200).json(medications);
  } catch (error) {
    console.error("Error fetching medications:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createMedication = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Medication name is required" });
    }

    const medication = await Medication.createMedication(req.body);
    res
      .status(201)
      .json({ message: "Medication created successfully", medication });
  } catch (error) {
    console.error("Error creating medication:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMedicationById = async (req, res) => {
  try {
    const medication = await Medication.getMedicationById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: "Medication not found" });
    }
    res.status(200).json(medication);
  } catch (error) {
    console.error("Error fetching medication:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateMedication = async (req, res) => {
  try {
    const medication = await Medication.updateMedication(
      req.params.id,
      req.body,
    );
    if (!medication) {
      return res.status(404).json({ error: "Medication not found" });
    }
    res
      .status(200)
      .json({ message: "Medication updated successfully", medication });
  } catch (error) {
    console.error("Error updating medication:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.deleteMedication(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: "Medication not found" });
    }
    res.status(200).json({ message: "Medication deleted successfully" });
  } catch (error) {
    console.error("Error deleting medication:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createMedicationLog = async (req, res) => {
  try {
    const { patient_user_id } = req.body;

    // Get the user role from the request (should be set by auth middleware)
    const userRole = req.user?.role || req.body.user_role;

    if (!patient_user_id) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    const log = await Medication.createMedicationLog(req.body);
    res
      .status(201)
      .json({ message: "Medication log created successfully", log });
  } catch (error) {
    console.error("Error creating medication log:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPatientMedicationLogs = async (req, res) => {
  try {
    await Medication.markOverdueMedicationLogs(req.params.patientId);
    await createMissedDoseAlerts(req.params.patientId);

    const logs = await Medication.getPatientMedicationLogs(
      req.params.patientId,
    );
    res.status(200).json(logs);
  } catch (error) {
    console.error("Error fetching medication logs:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateMedicationLogStatus = async (req, res) => {
  try {
    const { status, taken_at } = req.body;

    // Get the user role from the request (should be set by auth middleware)
    const userRole = req.user?.role || req.body.user_role;

    // Doctors cannot update medication logs - only patients or admins can
    if (userRole === "doctor") {
      return res.status(403).json({ error: "Doctors cannot create or modify patient medication logs" });
    }

    const validStatuses = ["pending", "taken", "missed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid medication status" });
    }

    const resolvedTakenAt =
      status === "taken" ? taken_at || new Date().toISOString() : taken_at;

    const log = await Medication.updateMedicationLogStatus(
      req.params.logId,
      status,
      resolvedTakenAt,
    );
    if (!log) {
      return res.status(404).json({ error: "Medication log not found" });
    }

    if (status === "missed") {
      let shouldAlert = false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (log.start_date || log.end_date) {
        const checkDates = [];
        if (log.start_date) {
          const sd = new Date(log.start_date);
          sd.setHours(0, 0, 0, 0);
          checkDates.push(sd.getTime());
        }
        if (log.end_date) {
          const ed = new Date(log.end_date);
          ed.setHours(0, 0, 0, 0);
          checkDates.push(ed.getTime());
        }

        if (checkDates.includes(today.getTime())) {
          shouldAlert = true;
        }
      } else {
        shouldAlert = true;
      }

      if (shouldAlert) {
        await Notification.createNotification({
          user_id: log.patient_user_id,
          type: "alert",
          title: `${formatDosePeriod(log.dose_period)} medication missed`,
          body: `A scheduled dose was marked as missed. Review your medications and contact your clinician if needed.`,
          reference_id: log.log_id,
          reference_type: "medication_log",
        });
      }

      await Medication.markMedicationLogAlertSent(log.log_id);
    }

    res
      .status(200)
      .json({ message: "Medication log updated successfully", log });
  } catch (error) {
    console.error("Error updating medication log:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getMedications,
  createMedication,
  getMedicationById,
  updateMedication,
  deleteMedication,
  createMedicationLog,
  getPatientMedicationLogs,
  updateMedicationLogStatus,
};
