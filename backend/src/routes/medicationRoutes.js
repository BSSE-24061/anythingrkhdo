const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const auth = require("../middlewares/auth");

// Patient medication logs (auth required) - SPECIFIC ROUTES FIRST before generic ones
router.post("/logs", auth, medicationController.createMedicationLog);
router.get(
  "/logs/patient/:patientId",
  auth,
  medicationController.getPatientMedicationLogs,
);
router.patch(
  "/logs/:logId/status",
  auth,
  medicationController.updateMedicationLogStatus,
);

// Public routes for medication catalog (GENERIC ROUTES LAST)
router.get("/", medicationController.getMedications);
router.post("/", medicationController.createMedication);
router.get("/:id", medicationController.getMedicationById);
router.put("/:id", medicationController.updateMedication);
router.delete("/:id", medicationController.deleteMedication);

module.exports = router;
