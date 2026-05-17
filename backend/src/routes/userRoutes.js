const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

router.param("id", (req, res, next, id) => {
  if (!uuidPattern.test(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  next();
});

// AUTH routes
router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/google-login", userController.googleLogin);
router.post("/google-onboarding", userController.googleOnboarding);

// Additional routes
router.get("/doctors/specialization/:specialization", userController.getDoctorsBySpecialization);
router.get("/specializations", userController.getAllSpecializations);
router.get("/consultant", userController.getConsultants);
router.get("/consultants", userController.getConsultants);

// CRUD routes
router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.patch("/:id/verification", userController.updateVerification);
router.delete("/:id", userController.deleteUser);

module.exports = router;
