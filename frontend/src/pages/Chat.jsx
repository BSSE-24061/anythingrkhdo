import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { chatApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const Chat = () => {
  const user = useMemo(() => getStoredUser(), []);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInbox = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError("");
      const response = await chatApi.inbox(user.id);
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load chat inbox."));
    }
  }, [user?.id]);

  useEffect(() => {
    const handle = window.requestAnimationFrame(() => {
      void loadInbox();
    });
    return () => window.cancelAnimationFrame(handle);
  }, [loadInbox]);

  const refreshMessages = async (room) => {
    try {
      const response = await chatApi.roomMessages(room.room_id);
      setMessages(Array.isArray(response.data) ? response.data : []);
      await chatApi.markRoomRead(room.room_id, user.id);
      await loadInbox();
    } catch {
      setError("Failed to load messages for this conversation.");
    }
  };

  const openRoom = async (room) => {
    const fresh = rooms.find((r) => r.room_id === room.room_id) || room;
    setActiveRoom(fresh);
    await refreshMessages(fresh);
  };

  const formatPeer = (room) => {
    if (!room) return "";
    if (user?.role === "patient") {
      return room.doctor_name || room.consultant_name || room.patient_name;
    }
    return room.patient_name || room.doctor_name || room.consultant_name;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!activeRoom || !message.trim()) return;

    const canSendDoctorChat =
      !activeRoom.doctor_user_id || activeRoom.chat_active !== false;
    const isConsultRoom = Boolean(activeRoom.consultant_user_id);

    if (!isConsultRoom && activeRoom.doctor_user_id && !canSendDoctorChat) {
      setError(
        "Messaging is available only before your appointment is completed or cancelled. Book a follow-up appointment to reopen chat.",
      );
      return;
    }

    try {
      setError("");
      await chatApi.sendMessage({
        room_id: activeRoom.room_id,
        sender_id: user.id,
        message_text: message.trim(),
      });
      setMessage("");
      await refreshMessages(activeRoom);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Message could not be sent — the visit may already be marked complete.",
        ),
      );
    }
  };

  const doctorRoomClosed =
    activeRoom?.doctor_user_id &&
    activeRoom.consultant_user_id == null &&
    activeRoom.chat_active === false;

  return (
    <div className="content-page two-column">
      <section className="panel">
        <p className="eyebrow">Secure messaging</p>
        <h3>Inbox</h3>
        {user?.role === "patient" && (
          <p className="muted" style={{ marginBottom: 12 }}>
            Doctor chats unlock after you{" "}
            <Link className="switch-link" to="/appointments" style={{ margin: 0 }}>
              schedule a visit
            </Link>
            .
          </p>
        )}
        {error && <p className="error-text">{error}</p>}
        <div className="list-stack">
          {rooms.length === 0 && <p className="muted">No conversations yet.</p>}
          {rooms.map((room) => {
            const isDoctorLane =
              room.doctor_user_id && room.consultant_user_id == null;
            const closed = isDoctorLane && room.chat_active === false;

            return (
              <button
                key={room.room_id}
                type="button"
                className={
                  activeRoom?.room_id === room.room_id ? "room-button active" : "room-button"
                }
                onClick={() => openRoom(room)}
              >
                <strong>{formatPeer(room) || `Room ${room.room_id.slice(0, 8)}`}</strong>
                <span className="muted">
                  {room.room_type?.replace(/-/g, " ") || "conversation"}
                </span>
                <span className={`status-pill ${closed ? "status-closed" : "status-open"}`}>
                  {closed ? "Visit closed" : "Open"}
                </span>
                <span className="muted">Unread · {room.unread_count ?? 0}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Conversation</h3>

        {!activeRoom && (
          <p className="muted">Select a thread to pick up messaging.</p>
        )}

        {activeRoom && (
          <>
            {doctorRoomClosed && (
              <p className="alert alert-info" style={{ marginBottom: 12 }}>
                This doctor chat closes automatically after the appointment finishes. Book
                another visit to continue messaging securely.
              </p>
            )}

            {!doctorRoomClosed && activeRoom.consultant_user_id && (
              <p className="alert alert-info" style={{ marginBottom: 12 }}>
                Consultants help triage unclear symptoms. They can steer you toward the best
                specialist before you formally book doctor time.
              </p>
            )}

            <div className="chat-box">
              {messages.length === 0 && (
                <p className="muted">No messages yet.</p>
              )}
              {messages.map((entry) => (
                <div
                  key={entry.message_id}
                  className={
                    entry.sender_id === user.id ? "chat-bubble me" : "chat-bubble"
                  }
                >
                  <p>{entry.message_text}</p>
                  <small className="muted">{entry.sender_name}</small>
                </div>
              ))}
            </div>

            <form className="message-composer" onSubmit={sendMessage}>
              <textarea
                rows={3}
                placeholder={
                  doctorRoomClosed
                    ? "Messaging paused for ended visits."
                    : "Type a thoughtful update..."
                }
                value={message}
                disabled={doctorRoomClosed}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="inline-actions">
                <button
                  type="submit"
                  className="btn-main small"
                  disabled={doctorRoomClosed}
                >
                  Send
                </button>
                <button
                  type="button"
                  className="btn-soft small btn"
                  onClick={() => activeRoom && refreshMessages(activeRoom)}
                >
                  Refresh
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
};

export default Chat;
