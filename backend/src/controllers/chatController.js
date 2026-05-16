const Chat = require("../models/chatModel");

const initializeRoom = async (req, res) => {
  try {
    const { patient_user_id, doctor_user_id, consultant_user_id, room_type } =
      req.body;

    if (!patient_user_id || (!doctor_user_id && !consultant_user_id)) {
      return res
        .status(400)
        .json({
          error: "Patient ID and a doctor or consultant ID are required",
        });
    }

    if (doctor_user_id && !consultant_user_id) {
      const allowed = await Chat.hasActiveDoctorAppointment(
        patient_user_id,
        doctor_user_id,
      );

      if (!allowed) {
        return res.status(403).json({
          error:
            "Messaging is available only while you have a pending or confirmed appointment with this doctor. Book or confirm an appointment first.",
        });
      }
    }

    const room = await Chat.findOrCreateRoom({
      patient_user_id,
      doctor_user_id,
      consultant_user_id,
      room_type: room_type || "consultation",
    });
    res.status(200).json({ message: "Chat room ready", room });
  } catch (error) {
    console.error("Error initializing room:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { room_id, sender_id, message_text } = req.body;

    if (!room_id || !sender_id || !message_text) {
      return res
        .status(400)
        .json({ error: "Room ID, Sender ID, and Message are required" });
    }

    const room = await Chat.getRoomById(room_id);
    if (!room) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const participant =
      sender_id === room.patient_user_id ||
      sender_id === room.doctor_user_id ||
      sender_id === room.consultant_user_id;
    if (!participant) {
      return res.status(403).json({ error: "Not a participant in this room" });
    }

    if (room.doctor_user_id && !room.consultant_user_id) {
      const allowed = await Chat.hasActiveDoctorAppointment(
        room.patient_user_id,
        room.doctor_user_id,
      );
      if (!allowed) {
        return res.status(403).json({
          error:
            `Messaging restricted. No active (pending/confirmed) appointment found between patient ${room.patient_user_id} and doctor ${room.doctor_user_id}.`,
        });
      }
    }

    const newMessage = await Chat.saveMessage(req.body);
    res.status(201).json({ message: "Message sent", data: newMessage });
  } catch (error) {
    console.error("Error sending message:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Chat.getRoomMessages(req.params.roomId);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getInbox = async (req, res) => {
  try {
    const rooms = await Chat.getUserRooms(req.params.userId);
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching inbox:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markRoomRead = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const messages = await Chat.markRoomAsRead(req.params.roomId, userId);
    res.status(200).json({ message: "Room marked as read", messages });
  } catch (error) {
    console.error("Error marking room as read:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markMessageRead = async (req, res) => {
  try {
    const message = await Chat.markMessageAsRead(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.status(200).json({ message: "Message marked as read", data: message });
  } catch (error) {
    console.error("Error marking message as read:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  initializeRoom,
  sendMessage,
  getMessages,
  getInbox,
  markRoomRead,
  markMessageRead,
};
