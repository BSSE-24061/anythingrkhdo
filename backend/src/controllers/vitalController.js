const Vital = require("../models/vitalModel");
const History = require("../models/historyModel"); // <-- NEW: Bring in the History model!
const Notification = require("../models/notificationModel");

const addVitalLog = async (req, res) => {
  try {
    const {
      patient_user_id,
      blood_pressure_systolic,
      oxygen_saturation,
      heart_rate,
      glucose_level,
    } = req.body;

    // Get the user role from the request (should be set by auth middleware)
    const userRole = req.user?.role || req.body.user_role;
    
    // Doctors cannot create vitals - only patients or admins can
    if (userRole === "doctor") {
      return res.status(403).json({ error: "Doctors cannot create or modify patient vitals" });
    }

    if (!patient_user_id) {
      return res.status(400).json({ error: "Patient ID is required" });
    }

    // 1. Save the vitals to the database
    const newVital = await Vital.createVitalLog(req.body);
    let alertGenerated = null;

    // 2. THE TRIAGE ENGINE
    if (oxygen_saturation && oxygen_saturation < 92) {
      alertGenerated = await Vital.createAlert({
        patient_user_id,
        vital_id: newVital.vital_id,
        alert_type: "Low Oxygen",
        message: `Patient oxygen saturation dropped to ${oxygen_saturation}%. Immediate attention required.`,
        severity: "critical",
      });
    } else if (blood_pressure_systolic && blood_pressure_systolic > 180) {
      alertGenerated = await Vital.createAlert({
        patient_user_id,
        vital_id: newVital.vital_id,
        alert_type: "Hypertensive Crisis",
        message: `Systolic Blood Pressure spiked to ${blood_pressure_systolic}.`,
        severity: "high",
      });
    } else if (heart_rate && (heart_rate > 120 || heart_rate < 50)) {
      alertGenerated = await Vital.createAlert({
        patient_user_id,
        vital_id: newVital.vital_id,
        alert_type: "Abnormal Heart Rate",
        message: `Heart rate recorded at ${heart_rate} bpm.`,
        severity: "medium",
      });
    } else if (glucose_level !== undefined && glucose_level !== null) {
      const g = Number(glucose_level);
      if (!Number.isNaN(g) && (g < 70 || g > 300)) {
        alertGenerated = await Vital.createAlert({
          patient_user_id,
          vital_id: newVital.vital_id,
          alert_type:
            g < 70 ? "Hypoglycemia Risk" : "Severe Hyperglycemia",
          message:
            g < 70
              ? `Blood glucose logged at ${g} mg/dL (low).`
              : `Blood glucose logged at ${g} mg/dL (very high).`,
          severity: g < 70 ? "high" : "high",
        });
      }
    }

    // 3. NEW: AUTOMATICALLY log the regular vitals to the timeline
    await History.addHistoryEvent({
      patient_user_id: patient_user_id,
      event_type: "Vitals Logged",
      title: `Patient submitted routine vitals`,
      added_by: patient_user_id,
    });

    // 4. NEW: If an alert was generated, drop a red flag in the timeline!
    if (alertGenerated) {
      await Notification.createNotification({
        user_id: patient_user_id,
        type: "alert",
        title: alertGenerated.alert_type,
        body: alertGenerated.message,
        reference_id: alertGenerated.alert_id,
        reference_type: "alert",
      });

      await History.addHistoryEvent({
        patient_user_id: patient_user_id,
        event_type: "System Alert",
        title: `⚠️ ${alertGenerated.severity.toUpperCase()} ALERT: ${alertGenerated.alert_type}`,
        description: alertGenerated.message,
      });
    }

    res.status(201).json({
      message: "Vitals logged successfully",
      vitals: newVital,
      alert: alertGenerated ? alertGenerated : "No alerts triggered",
    });
  } catch (error) {
    console.error("Error logging vitals:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getVitals = async (req, res) => {
  try {
    const vitals = await Vital.getPatientVitals(req.params.patientId);
    res.status(200).json(vitals);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAlerts = async (req, res) => {
  try {
    const alerts = await Vital.getPatientAlerts(req.params.patientId);
    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  addVitalLog,
  getVitals,
  getAlerts,
};
