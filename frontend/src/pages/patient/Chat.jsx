import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { chatApi, getErrorMessage } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";

const Chat = () => {
  const user = getStoredUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // currentSelection can be a room_id OR a doctor/consultant user_id
  const [currentSelection, setCurrentSelection] = useState(searchParams.get("room") || "");
  const [composer, setComposer] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Map rooms to a consistent structure
  const inboxRooms = useMemo(() => {
    return rooms.map(r => ({
      ...r,
      // uniqueId for tracking selection
      uniqueId: r.room_id || r.doctor_user_id || r.consultant_user_id
    }));
  }, [rooms]);

  const loadInbox = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError("");
      const response = await chatApi.inbox(user.id);
      setRooms(response.data || []);
    } catch (err) {
      setError("Failed to load your inbox.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInbox(); }, [user?.id]);

  // Determine if the selection is a real room or a potential one
  const selectedRoom = useMemo(() => {
    return inboxRooms.find(r => r.uniqueId === currentSelection);
  }, [inboxRooms, currentSelection]);

  const fetchMessages = async () => {
    if (!selectedRoom || !selectedRoom.room_id) {
      setMessages([]);
      return;
    }
    try {
      const response = await chatApi.roomMessages(selectedRoom.room_id);
      setMessages(response.data || []);
      await chatApi.markRoomRead(selectedRoom.room_id, user.id);
    } catch (err) {
      console.error("sync error:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [selectedRoom?.room_id, user?.id]);

  useEffect(() => {
    const box = document.getElementById("chat-box-area");
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  const openRoom = (room) => {
    setCurrentSelection(room.uniqueId);
    setSearchParams({ room: room.uniqueId });
    setError("");
  };

  const send = async (event) => {
    event.preventDefault();
    if (!composer.trim() || !selectedRoom) return;

    let roomId = selectedRoom.room_id;
    const text = composer;

    try {
      setError("");
      setComposer("");

      // If room doesn't exist yet, create it
      if (!roomId) {
        const createRes = await chatApi.findOrCreateRoom({
          patient_user_id: user.id,
          doctor_user_id: selectedRoom.doctor_user_id,
          consultant_user_id: selectedRoom.consultant_user_id,
          room_type: selectedRoom.room_type || "appointment"
        });
        roomId = createRes.data.room.room_id;
        // Update selection and search params to the new real room_id
        setCurrentSelection(roomId);
        setSearchParams({ room: roomId });
        // Refresh inbox to get the real room object
        loadInbox();
      }

      await chatApi.sendMessage({
        room_id: roomId,
        sender_id: user.id,
        message_text: text,
      });
      
      fetchMessages();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to send message.";
      setError(msg);
      setComposer(text); 
    }
  };

  return (
    <div className="page-shell">
      <div className="grid-layout" style={{ gridTemplateColumns: "300px 1fr", gap: 0, background: "#fff", borderRadius: 24, overflow: "hidden", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
        
        {/* Inbox Sidebar */}
        <aside style={{ borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", background: "#fff", minHeight: "600px" }}>
          <div style={{ padding: "24px 20px" }}>
            <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900 }}>Messages</h2>
            <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>All Consultations</p>
          </div>
          
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "600px" }}>
            {loading ? (
              <p className="muted" style={{ padding: 20 }}>Loading...</p>
            ) : inboxRooms.length ? inboxRooms.map((room) => (
              <div 
                key={room.uniqueId}
                onClick={() => openRoom(room)}
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--line)",
                  background: room.uniqueId === currentSelection ? "rgba(20, 184, 166, 0.05)" : "transparent",
                  borderLeft: room.uniqueId === currentSelection ? "4px solid #14b8a6" : "4px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 12
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: room.uniqueId === currentSelection ? "#14b8a6" : "#2563eb", color: "#fff", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18 }}>
                  {(room.other_user_name)?.[0] || "U"}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {room.other_user_role === 'doctor' ? `Dr. ${room.other_user_name}` : room.other_user_name || "User"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="muted" style={{ fontSize: 12 }}>{room.room_type || "consultation"}</div>
                    {!room.room_id && <span style={{ fontSize: 10, background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>New</span>}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: 40, textAlign: "center" }}>
                <p className="muted">No chats found.</p>
                <p className="muted" style={{ fontSize: 12 }}>No messages available.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Message Area */}
        <main style={{ display: "flex", flexDirection: "column", background: "#ffffffff" }}>
          {selectedRoom ? (
            <>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 900, fontSize: "1.2rem" }}>
                    {selectedRoom.other_user_role === 'doctor' ? `Dr. ${selectedRoom.other_user_name}` : selectedRoom.other_user_name || "User"}
                  </div>
                  {selectedRoom.chat_active && <span className="status-pill status-open" style={{ fontSize: 10, background: "#dcfce7", color: "#166534" }}>Active Session</span>}
                </div>
                {!selectedRoom.room_id && <small className="muted" style={{ fontWeight: 700 }}>Starting new chat...</small>}
              </div>

              {error && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 24px", fontSize: 12, fontWeight: 700, borderBottom: "1px solid #fee2e2" }}>⚠️ {error}</div>}

              <div id="chat-box-area" style={{ height: "450px", overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16, background: "#f3f4f6" }}>
                {messages.length ? messages.map((m) => {
                  const isMe = m.sender_id === user.id;
                  return (
                    <div key={m.message_id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                      <div style={{ 
                        padding: "12px 16px", 
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? "#14b8a6" : "#fff",
                        color: isMe ? "#fff" : "#1e293b",
                        border: isMe ? "none" : "1px solid var(--line)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
                      }}>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{m.message_text}</p>
                        <div style={{ fontSize: 10, marginTop: 4, textAlign: "right", opacity: 0.8, fontWeight: 700 }}>
                          {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                   <div style={{ flex: 1, display: "grid", placeItems: "center", opacity: 0.5 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
                        <p style={{ margin: 0, fontWeight: 800 }}>Start your conversation with {selectedRoom.other_user_name}</p>
                      </div>
                   </div>
                )}
              </div>

              {/* Input Footer */}
              <form onSubmit={send} style={{ padding: "20px 24px", borderTop: "1px solid var(--line)", background: "#fff" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <textarea 
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Type a message..."
                    rows="1"
                    style={{ 
                      flex: 1,
                      padding: "12px 16px", 
                      borderRadius: 12, 
                      border: "2px solid var(--line)", 
                      background: "#fff", 
                      resize: "none",
                      fontSize: 14,
                      outline: "none"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send(e);
                      }
                    }}
                  />
                  <button 
                    type="submit" 
                    className="btn-main"
                    disabled={!composer.trim()}
                    style={{ padding: "0 24px", background: "#14b8a6" }}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: "grid", placeItems: "center", textAlign: "center", padding: 60 }}>
              <div>
                <div style={{ fontSize: 64, marginBottom: 20 }}>💬</div>
                <h2 style={{ marginBottom: 12 }}>Your Inbox</h2>
                <p className="muted" style={{ maxWidth: 400 }}>Choose a provider from your appointments or consultations to view messages.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Chat;
