const bcrypt = require("bcryptjs");
const User = require("./src/models/userModel");

const SPECS = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "General Medicine",
  "Psychiatry",
  "Gynecology"
];

async function seed() {
  try {
    const password_hash = await bcrypt.hash("password123", 10);
    for (const spec of SPECS) {
      // Create a dummy doctor for each spec
      const name = `Dr. ${spec} Specialist`;
      const email = `${spec.toLowerCase().replace(/ /g, "_")}@example.com`;
      
      const existing = await User.getUserByEmail(email);
      if (existing) {
        console.log(`User ${email} already exists.`);
        continue;
      }
      
      await User.createUser({
        full_name: name,
        email: email,
        password_hash: password_hash,
        role: "doctor",
        phone: "555-000-0000",
        gender: "other",
        specialization: spec,
        license_number: `LIC-${spec.substring(0, 3).toUpperCase()}-123`,
        hospital_name: "Central General Hospital",
        experience_years: 10,
        is_verified: true
      });
      console.log(`Created doctor for ${spec}`);
    }
    console.log("Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
