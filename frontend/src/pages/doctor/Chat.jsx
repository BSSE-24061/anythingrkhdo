import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { appointmentApi, chatApi } from "../../utils/apiHelper";
import { formatIslamabadDateTime } from "../../utils/dateTime";
import { getStoredUser } from "../../utils/session";

const Chat = () => {
  const user = getStoredUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentRoomId, setCurrentRoomId] = useState(searchParams.get("room") || "");
  const patientFromUrl = searchParams.get("patient") || "";
  const [composer, setComposer] = useState("");

  const activeChatPatients = useMemo(() => {
    const patientsById = new Map();

    appointments.forEach((appointment) => {
      if (!appointment.patient_user_id || patientsById.has(appointment.patient_user_id)) {
        return;
      }

      patientsById.set(appointment.patient_user_id, {
        patient_user_id: appointment.patient_user_id,
        patient_name: appointment.patient_name || "Patient",
        scheduled_at: appointment.scheduled_at,
      });
    });

    return Array.from(patientsById.values());
  }, [appointments]);

  const inboxRooms = useMemo(() => {
    const roomsByKey = new Map();

    rooms.forEach((room) => {
      const key =
        room.patient_user_id ||
        room.consultant_user_id ||
        room.room_id;

      if (!roomsByKey.has(key)) {
        roomsByKey.set(key, room);
      }
    });

    return Array.from(roomsByKey.values());
  }, [rooms]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      try {
        const [appointmentResponse, roomResponse] = await Promise.all([
          appointmentApi.byDoctor(user.id),
          chatApi.inbox(user.id),
        ]);

        const now = Date.now();
        setAppointments(
          (appointmentResponse.data || []).filter(
            (appointment) => {
              const scheduledAt = new Date(appointment.scheduled_at).getTime();

              return (
                appointment.status !== "completed" &&
                appointment.status !== "cancelled" &&
                Number.isFinite(scheduledAt) &&
                scheduledAt <= now
              );
            },
          ),
        );
        setRooms(roomResponse.data || []);

        if (patientFromUrl && !currentRoomId) {
          const chatResponse = await chatApi.findOrCreateRoom({
            patient_user_id: patientFromUrl,
            doctor_user_id: user.id,
            room_type: "consultation",
          });
          const roomId = chatResponse.data.room.room_id;
          setCurrentRoomId(roomId);
          setSearchParams({ room: roomId });
        }
      } catch (error) {
        console.error(error);
      }
    };

    load();
  }, [currentRoomId, patientFromUrl, setSearchParams, user?.id]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!currentRoomId) {
        setMessages([]);
        return;
      }

      try {
        const response = await chatApi.roomMessages(currentRoomId);
        setMessages(response.data || []);
        await chatApi.markRoomRead(currentRoomId, user.id);
      } catch (error) {
        console.error(error);
      }
    };

    loadMessages();
  }, [currentRoomId, user?.id]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.room_id === currentRoomId),
    [rooms, currentRoomId],
  );

  const openRoom = async (roomId) => {
    setCurrentRoomId(roomId);
    setSearchParams({ room: roomId });
  };

  const startChat = async (patientId) => {
    try {
      const response = await chatApi.findOrCreateRoom({
        patient_user_id: patientId,
        doctor_user_id: user.id,
        room_type: "consultation",
      });
      await openRoom(response.data.room.room_id);
    } catch (error) {
      console.error(error);
    }
  };

  const send = async (event) => {
    event.preventDefault();
    if (!composer || !currentRoomId) return;

    try {
      await chatApi.sendMessage({
        room_id: currentRoomId,
        sender_id: user.id,
        message_text: composer,
      });
      setComposer("");
      const response = await chatApi.roomMessages(currentRoomId);
      setMessages(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <section className="page-heading">
        <div>
          <h1>Chat</h1>
          <p className="muted">Talk to patients who still have active appointments.</p>
        </div>
      </section>

      <section className="grid-layout two-col">
        <div className="card doctor-chat-list">
          <div className="section-heading"><h3>Active Appointment Chats</h3></div>
          <div className="list-stack">
            {activeChatPatients.length ? activeChatPatients.map((appointment) => (
              <div className="list-item chat-row" key={appointment.patient_user_id}>
                <div>
                  <strong>{appointment.patient_name}</strong>
                  <p>{formatIslamabadDateTime(appointment.scheduled_at)}</p>
                </div>
                <button className="btn-soft small" onClick={() => startChat(appointment.patient_user_id)}>Open</button>
              </div>
            )) : <p className="muted">No appointment chats are active right now.</p>}
          </div>

          <div className="section-heading" style={{ marginTop: 20 }}><h3>Inbox</h3></div>
          <div className="list-stack">
            {inboxRooms.length ? inboxRooms.map((room) => (
              <div className={`list-item chat-row ${room.room_id === currentRoomId ? "active" : ""}`} key={room.room_id}>
                <div>
                  <strong>{room.patient_name || room.consultant_name || "Chat"}</strong>
                  <span>Unread: {room.unread_count || 0}</span>
                </div>
                <button className="btn-main small" onClick={() => openRoom(room.room_id)}>Open</button>
              </div>
            )) : <p className="muted">No chat rooms yet.</p>}
          </div>
        </div>

        <div className="card doctor-chat-panel">
          <div className="section-heading"><h3>{selectedRoom ? selectedRoom.patient_name || "Conversation" : "Conversation"}</h3></div>
          <div className="chat-box">
            {messages.length ? messages.map((message) => (
              <div className={`chat-bubble ${message.sender_id === user.id ? "me" : ""}`} key={message.message_id}>
                <p>{message.message_text}</p>
                <small>{formatIslamabadDateTime(message.sent_at)}</small>
              </div>
            )) : <p className="muted">Select a room to see messages.</p>}
          </div>

          <form onSubmit={send} className="message-composer" style={{ marginTop: 16 }}>
            <textarea rows="4" value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="Type a message" />
            <button type="submit" className="btn-main">Send</button>
          </form>
        </div>
      </section>
    </>
  );
};

export default Chat;
