import { useEffect, useMemo, useState } from "react";
import { notificationApi, userApi, medicationApi } from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import AppShell from "../../layouts/AppShell";

const AdminDashboard = () => {
  const user = useMemo(() => getStoredUser(), []);

  const [unread, setUnread] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingMedications, setPendingMedications] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = async () => {
    if (!user?.id) return;
    try {
      const unreadResponse = await notificationApi.unreadCount(user.id);
      setUnread(unreadResponse.data.unread_count || 0);
    } catch {
      setUnread(0);
    }
  };

  const loadPendingUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await userApi.list();
      const queue = response.data.filter(
        (u) => (u.role === "doctor" || u.role === "consultant") && !u.is_verified,
      );
      setPendingUsers(queue);
    } catch {
      setError("Unable to load verification queue.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPendingMedications = async () => {
    setLoadingMedications(true);
    try {
      const response = await medicationApi.list('pending');
      setPendingMedications(response.data || []);
    } catch {
      console.error("Unable to load pending medications.");
    } finally {
      setLoadingMedications(false);
    }
  };

  useEffect(() => {
    load();
    loadPendingUsers();
    loadPendingMedications();

    const interval = setInterval(() => {
      load();
      loadPendingUsers();
      loadPendingMedications();
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const approveUser = async (targetUserId) => {
    try {
      await userApi.updateVerification(targetUserId, true);
      setPendingUsers((prev) => prev.filter((item) => item.user_id !== targetUserId));
      setSuccessMessage("User approved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to update verification status.");
    }
  };

  const rejectUser = async (targetUserId) => {
    try {
      await userApi.updateVerification(targetUserId, false);
      setPendingUsers((prev) => prev.filter((item) => item.user_id !== targetUserId));
      setSuccessMessage("User rejected successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to update verification status.");
    }
  };

  const approveMedication = async (medId) => {
    try {
      await medicationApi.update(medId, { status: "approved" });
      setPendingMedications(prev => prev.filter(m => m.medication_id !== medId));
      setSuccessMessage("Medication approved!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to approve medication.");
    }
  };

  const rejectMedication = async (medId) => {
    try {
      await medicationApi.delete(medId);
      setPendingMedications(prev => prev.filter(m => m.medication_id !== medId));
      setSuccessMessage("Medication rejected and deleted!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to reject medication.");
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 32, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Welcome, {user.name || "Admin"}
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontWeight: 600, fontSize: 18 }}>
            Manage user verifications and system oversight.
          </p>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Unread Alerts</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{unread}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>🔔</div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Verification Queue</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{pendingUsers.length}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>📋</div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Medication Requests</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{pendingMedications.length}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>💊</div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18 }}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Doctor and Consultant Verification</h3>
            <p style={{ margin: "4px 0 16px", color: "#64748b", fontWeight: 600, fontSize: 14 }}>Review and manage user applications</p>

            {successMessage && <p style={{ color: "#15803d", marginBottom: "15px", fontWeight: 600 }}>✓ {successMessage}</p>}
            {error && <p style={{ color: "#b91c1c", marginBottom: "15px", fontWeight: 600 }}>✗ {error}</p>}

            {loadingUsers ? (
              <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>Loading users...</div>
            ) : pendingUsers.length === 0 ? (
              <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No pending users. All applications are reviewed.</div>
            ) : (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {pendingUsers.map((item) => (
                  <div key={item.user_id} style={{ border: "1px solid #e6edf5", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.22)", display: "grid", placeItems: "center", color: "#2563eb", fontWeight: 900 }}>👤</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{item.full_name}</div>
                        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>{item.email}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 11, background: item.role === "doctor" ? "rgba(37, 99, 235, 0.12)" : "rgba(13, 148, 136, 0.12)", color: item.role === "doctor" ? "#1d4ed8" : "#0f766e" }}>
                        {item.role.toUpperCase()}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => approveUser(item.user_id)} style={{ padding: "6px 12px", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer" }}>Approve</button>
                        <button onClick={() => rejectUser(item.user_id)} style={{ padding: "6px 12px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18 }}>
            <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Pending Medication Requests</h3>
            <p style={{ margin: "4px 0 16px", color: "#64748b", fontWeight: 600, fontSize: 14 }}>Review new medications requested by doctors</p>

            {loadingMedications ? (
              <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>Loading medications...</div>
            ) : pendingMedications.length === 0 ? (
              <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No pending medications.</div>
            ) : (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {pendingMedications.map((item) => (
                  <div key={item.medication_id} style={{ border: "1px solid #e6edf5", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.22)", display: "grid", placeItems: "center", color: "#2563eb", fontWeight: 900 }}>💊</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 14 }}>{item.name}</div>
                        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>Type: {item.type || "N/A"} • {item.description || "No description"}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => approveMedication(item.medication_id)} style={{ padding: "6px 12px", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer" }}>Approve</button>
                        <button onClick={() => rejectMedication(item.medication_id)} style={{ padding: "6px 12px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default AdminDashboard;
