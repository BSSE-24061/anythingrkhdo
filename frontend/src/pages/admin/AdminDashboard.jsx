import { useEffect, useMemo, useState } from "react";
import {
  notificationApi,
  userApi,
} from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import AppShell from "../../layouts/AppShell";

const AdminDashboard = () => {
  const user = useMemo(() => getStoredUser(), []);

  const [unread, setUnread] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      try {
        const unreadResponse = await notificationApi.unreadCount(user.id);
        setUnread(unreadResponse.data.unread_count || 0);
      } catch {
        setUnread(0);
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    const loadPendingUsers = async () => {
      setLoadingUsers(true);
      setError("");
      setSuccessMessage("");

      try {
        const response = await userApi.list();

        const queue = response.data.filter(
          (u) =>
            (u.role === "doctor" || u.role === "consultant") &&
            !u.is_verified,
        );

        setPendingUsers(queue);
      } catch {
        setError("Unable to load verification queue.");
      } finally {
        setLoadingUsers(false);
      }
    };

    loadPendingUsers();
  }, []);

  const approveUser = async (targetUserId) => {
    try {
      await userApi.updateVerification(targetUserId, true);

      setPendingUsers((prev) =>
        prev.filter((item) => item.user_id !== targetUserId),
      );
      setSuccessMessage("User approved successfully!");
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to update verification status.");
    }
  };

  const rejectUser = async (targetUserId) => {
    try {
      await userApi.updateVerification(targetUserId, false);

      setPendingUsers((prev) =>
        prev.filter((item) => item.user_id !== targetUserId),
      );
      setSuccessMessage("User rejected successfully!");
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setError("Failed to update verification status.");
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="dashboard-page">
        <section className="panel hero-panel">
          <div>
            <p className="eyebrow">Dashboard</p>

            <div className="page-header">
              <div>
                <h2>Welcome, {user.name || "Admin"}</h2>

                <p className="muted">
                  Manage user verifications and system oversight.
                </p>
              </div>

              <span className="page-tag">ADMIN</span>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <p>Unread Alerts</p>
                <h3>{unread}</h3>
              </article>

              <article className="stat-card">
                <p>Verification Queue</p>
                <h3>{pendingUsers.length}</h3>
              </article>

              <article className="stat-card">
                <p>Pending Action</p>
                <h3>{loadingUsers ? "..." : (pendingUsers.length > 0 ? "Yes" : "No")}</h3>
              </article>
            </div>
          </div>

          <div className="mini-stats">
            <div className="card">
              <h3>Admin Center</h3>

              <p className="muted">
                Review and approve doctor and consultant applications.
                Monitor system activity and user management.
              </p>
            </div>

            <div className="card">
              <h3>System Status</h3>

              <div className="action-grid">
                <div className="action-card btn-ghost">
                  ✓ System Online
                </div>

                <div className="action-card btn-ghost">
                  {pendingUsers.length} Pending Reviews
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h3>Doctor and Consultant Verification</h3>
            <p className="muted">Review and manage user applications</p>
          </div>

          {successMessage && (
            <p style={{ color: "#28a745", marginBottom: "15px" }}>
              ✓ {successMessage}
            </p>
          )}

          {error && (
            <p style={{ color: "#dc3545", marginBottom: "15px" }}>
              ✗ {error}
            </p>
          )}

          {loadingUsers ? (
            <p className="muted">Loading users...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="muted">No pending users. All applications are reviewed.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {pendingUsers.map((item) => (
                    <tr key={item.user_id}>
                      <td>{item.full_name}</td>
                      <td>{item.email}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            background: item.role === "doctor" ? "#007bff" : "#17a2b8",
                            color: "white",
                            fontSize: "0.85em",
                          }}
                        >
                          {item.role.toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            type="button"
                            className="btn-main small"
                            onClick={() => approveUser(item.user_id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.85em",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-ghost small"
                            onClick={() => rejectUser(item.user_id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.85em",
                              color: "#dc3545",
                              borderColor: "#dc3545",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default AdminDashboard;
