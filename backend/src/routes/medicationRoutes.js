const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medicationController");
const auth = require("../middlewares/auth");

<<<<<<< HEAD
// Patient medication logs (auth required) - SPECIFIC ROUTES FIRST before generic ones
router.post("/logs", auth, medicationController.createMedicationLog);
router.get(
  "/logs/patient/:patientId",
  auth,
=======
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
>>>>>>> parent of 42a0ed9 (push)
  medicationController.getPatientMedicationLogs,
);
router.patch(
  "/logs/:logId/status",
<<<<<<< HEAD
  auth,
  medicationController.updateMedicationLogStatus,
);

// Public routes for medication catalog (GENERIC ROUTES LAST)
router.get("/", medicationController.getMedications);
router.post("/", medicationController.createMedication);
router.get("/:id", medicationController.getMedicationById);
router.put("/:id", medicationController.updateMedication);
router.delete("/:id", medicationController.deleteMedication);

=======
  medicationController.updateMedicationLogStatus,
);

>>>>>>> parent of 42a0ed9 (push)
module.exports = router;
