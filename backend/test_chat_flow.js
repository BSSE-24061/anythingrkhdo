const db = require("./src/config/db");
const chatModel = require("./src/models/chatModel");

async function runTests() {
  console.log("Starting Chat Flow Tests...\n");

  try {
    // 1. Get a Patient
    const patientRes = await db.query("SELECT * FROM users WHERE role = 'patient' LIMIT 1");
    if (!patientRes.rows.length) throw new Error("No patient found");
    const patient = patientRes.rows[0];
    console.log(`[✓] Selected Patient: ${patient.full_name} (${patient.user_id})`);

    // 2. Get a Consultant
    const consultantRes = await db.query("SELECT * FROM users WHERE role = 'consultant' LIMIT 1");
    if (!consultantRes.rows.length) throw new Error("No consultant found");
    const consultant = consultantRes.rows[0];
    console.log(`[✓] Selected Consultant: ${consultant.full_name} (${consultant.user_id})`);

    // 3. Find or Create Room between Patient and Consultant
    const room = await chatModel.findOrCreateRoom({
      patient_user_id: patient.user_id,
      consultant_user_id: consultant.user_id,
      room_type: "consultation"
    });
    console.log(`[✓] Room found/created: ${room.room_id}`);

    // 4. Send a message from Patient to Consultant
    const msg1 = await chatModel.saveMessage({
      room_id: room.room_id,
      sender_id: patient.user_id,
      message_text: "Hello Consultant, this is a test message from Patient."
    });
    console.log(`[✓] Message 1 sent from Patient: "${msg1.message_text}"`);

    // 5. Send a reply from Consultant to Patient
    const msg2 = await chatModel.saveMessage({
      room_id: room.room_id,
      sender_id: consultant.user_id,
      message_text: "Hello Patient, I received your message. Let's start the consultation."
    });
    console.log(`[✓] Message 2 sent from Consultant: "${msg2.message_text}"`);

    // 6. Verify Patient's Inbox
    const patientRooms = await chatModel.getUserRooms(patient.user_id);
    const consultantRoomInPatientInbox = patientRooms.find(r => r.room_id === room.room_id);
    if (!consultantRoomInPatientInbox) throw new Error("Room missing in patient's inbox");
    console.log(`[✓] Patient's inbox successfully displays Consultant: ${consultantRoomInPatientInbox.other_user_name}`);

    // 7. Verify Consultant's Inbox
    const consultantRooms = await chatModel.getUserRooms(consultant.user_id);
    const patientRoomInConsultantInbox = consultantRooms.find(r => r.room_id === room.room_id);
    if (!patientRoomInConsultantInbox) throw new Error("Room missing in consultant's inbox");
    console.log(`[✓] Consultant's inbox successfully displays Patient: ${patientRoomInConsultantInbox.other_user_name}`);

    // 8. Test Doctor Chat
    console.log("\nTesting Doctor Chat...");
    const doctorRes = await db.query("SELECT * FROM users WHERE role = 'doctor' LIMIT 1");
    if (doctorRes.rows.length) {
      const doctor = doctorRes.rows[0];
      console.log(`[✓] Selected Doctor: ${doctor.full_name} (${doctor.user_id})`);
      
      const docRoom = await chatModel.findOrCreateRoom({
        patient_user_id: patient.user_id,
        doctor_user_id: doctor.user_id,
        room_type: "appointment"
      });
      console.log(`[✓] Doctor Room found/created: ${docRoom.room_id}`);

      await chatModel.saveMessage({
        room_id: docRoom.room_id,
        sender_id: doctor.user_id,
        message_text: "Hello, reviewing your appointment."
      });
      console.log(`[✓] Message sent from Doctor.`);

      const pRooms = await chatModel.getUserRooms(patient.user_id);
      const docRoomInPatient = pRooms.find(r => r.room_id === docRoom.room_id);
      console.log(`[✓] Patient sees Doctor in inbox: ${docRoomInPatient.other_user_name}`);
      
      const dRooms = await chatModel.getUserRooms(doctor.user_id);
      const pRoomInDoctor = dRooms.find(r => r.room_id === docRoom.room_id);
      console.log(`[✓] Doctor sees Patient in inbox: ${pRoomInDoctor.other_user_name}`);
    }

    console.log("\n All chat feature tests passed successfully!");
  } catch (error) {
    console.error("\n Test Failed:", error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

runTests();
