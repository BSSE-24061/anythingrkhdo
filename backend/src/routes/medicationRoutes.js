const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const auth = require("../middlewares/auth");

// Public routes for medication catalog
router.get("/", medicationController.getMedications);
router.get("/:id", medicationController.getMedicationById);
router.post("/", medicationController.createMedication);
router.put("/:id", medicationController.updateMedication);
router.delete("/:id", medicationController.deleteMedication);

// Apply auth middleware to patient-specific medication log routes
router.use(auth);

// Patient medication logs (auth required)
router.post("/logs", medicationController.createMedicationLog);
router.get(
  "/logs/patient/:patientId",
  medicationController.getPatientMedicationLogs,
);
router.patch(
  "/logs/:logId/status",
  medicationController.updateMedicationLogStatus,
);

module.exports = router;
