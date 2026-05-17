
// Dashboard.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  notificationApi,
  userApi,
  vitalApi,
  medicationApi,
  historyApi,
  blogApi,
  forumApi,
} from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const Dashboard = () => {
  const user = useMemo(() => getStoredUser(), []);

  const [unread, setUnread] = useState(0);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");

  const [specializations, setSpecializations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);

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
      if (user?.role !== "admin") return;

      setLoadingUsers(true);
      setError("");

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
  }, [user]);

  useEffect(() => {
    const loadPatientData = async () => {
      if (user?.role !== "patient") return;

      try {
        const specResponse = await userApi.getAllSpecializations();
        setSpecializations(specResponse.data || []);

        const alertsResponse = await vitalApi.getAlerts(user.id);
        setAlerts(alertsResponse.data || []);

        const logsResponse = await medicationApi.getLogsByPatient(user.id);
        setMedicationLogs(logsResponse.data || []);

        const historyResponse = await historyApi.getByPatient(user.id);
        setRecentHistory(historyResponse.data || []);

        const blogsResponse = await blogApi.feed();
        setBlogs(blogsResponse.data || []);

        const forumResponse = await forumApi.feed();
        setForumPosts(forumResponse.data || []);
      } catch (err) {
        console.error("Error loading patient data:", err);
      }
    };

    loadPatientData();
  }, [user]);

  const approveUser = async (targetUserId) => {
    try {
      await userApi.updateVerification(targetUserId, true);

      setPendingUsers((prev) =>
        prev.filter((item) => item.user_id !== targetUserId),
      );
    } catch {
      setError("Failed to update verification status.");
    }
  };

  const pendingMedications = medicationLogs.filter(
    (log) => log.status === "pending",
  );

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Dashboard</p>

          <div className="page-header">
            <div>
              <h2>Welcome back, {user.name || "Patient"}</h2>

              <p className="muted">
                A quick view of your health status and next actions.
              </p>
            </div>

            <span className="page-tag">
              {(user.role || "").toUpperCase()}
            </span>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <p>Unread Alerts</p>
              <h3>{unread}</h3>
            </article>

            {user.role === "patient" && (
              <>
                <article className="stat-card">
                  <p>Active Alerts</p>
                  <h3>{alerts.length}</h3>
                </article>

                <article className="stat-card">
                  <p>Pending Medications</p>
                  <h3>{pendingMedications.length}</h3>
                </article>
              </>
            )}

            {user.role === "admin" && (
              <article className="stat-card">
                <p>Verification Queue</p>
                <h3>{pendingUsers.length}</h3>
              </article>
            )}
          </div>
        </div>

        <div className="mini-stats">
          <div className="card">
            <h3>Today’s Focus</h3>

            <p className="muted">
              Keep an eye on important alerts, medication reminders,
              and upcoming care.
            </p>
          </div>

          <div className="card">
            <h3>Quick Actions</h3>

            <div className="action-grid">
              <Link to="/appointments" className="action-card btn-main">
                Book Appointment
              </Link>

              <Link to="/consultant" className="action-card btn-ghost">
                Consult Specialist
              </Link>

              <Link to="/vitals" className="action-card btn-ghost">
                Add Vitals
              </Link>

              <Link to="/medications" className="action-card btn-ghost">
                Medication Logs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {user.role === "admin" && (
        <section className="panel">
          <div className="section-heading">
            <h3>Doctor and Consultant Verification</h3>
          </div>

          {error && <p className="error-text">{error}</p>}

          {loadingUsers ? (
            <p className="muted">Loading users...</p>
          ) : pendingUsers.length === 0 ? (
            <p className="muted">No pending users.</p>
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
                      <td>{item.role}</td>

                      <td>
                        <button
                          type="button"
                          className="btn-main small"
                          onClick={() => approveUser(item.user_id)}
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {user.role === "patient" && (
        <>
          <section className="panel">
            <div className="section-heading">
              <h3>Medical Specializations</h3>
            </div>

            <p className="muted">
              Choose a specialization to find doctors.
            </p>

            <div className="feature-list">
              {specializations.length > 0 ? (
                specializations.map((spec) => (
                  <Link
                    key={spec}
                    to={`/specializations/${encodeURIComponent(spec)}`}
                    className="spec-link"
                  >
                    {spec}
                  </Link>
                ))
              ) : (
                <span className="muted">
                  No specializations available yet.
                </span>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>Recent Activity</h3>

              <span className="muted">
                Latest events from your health timeline
              </span>
            </div>

            <div className="list-stack">
              {recentHistory.length > 0 ? (
                recentHistory.map((item) => (
                  <Link
                    key={item.history_id}
                    className="list-item"
                    to="/history"
                    style={{ textDecoration: "none" }}
                  >
                    <h4>{item.title}</h4>

                    <p className="muted">
                      {item.event_date
                        ? new Date(item.event_date).toLocaleDateString()
                        : "Date N/A"}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="muted">No recent activity</p>
              )}
            </div>
          </section>

          <div className="grid-layout two-col">
            <section className="panel">
              <div className="section-heading">
                <h3>Health Alerts</h3>

                <span className="muted">
                  Monitor your current alerts
                </span>
              </div>

              <div className="list-stack">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="list-item alert-item"
                    >
                      <h4>{alert.alert_type}</h4>

                      <p>{alert.message}</p>

                      <span className="muted">
                        {new Date(alert.triggered_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="muted">No active alerts</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <h3>Pending Medications</h3>

                <span className="muted">
                  Stay ahead of your next doses
                </span>
              </div>

              <div className="list-stack">
                {pendingMedications.length > 0 ? (
                  pendingMedications.map((log) => (
                    <div key={log.log_id} className="list-item">
                      <h4>
                        Medication due:
                        {" "}
                        {new Date(
                          log.scheduled_time,
                        ).toLocaleString()}
                      </h4>

                      <p className="muted">
                        Status: {log.status}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="muted">
                    No pending medications
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="grid-layout two-col">
            <section className="panel">
              <div className="section-heading">
                <h3>Latest Blogs</h3>

                <span className="muted">
                  Insights from the care community
                </span>
              </div>

              <div className="list-stack">
                {blogs.length > 0 ? (
                  blogs.map((blog) => (
                    <Link
                      key={blog.article_id}
                      className="list-item"
                      to={`/blogs/${blog.article_id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <h4>{blog.title}</h4>

                      <p className="muted">
                        By {blog.author_name || "Unknown"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="muted">No blogs available</p>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <h3>Community Posts</h3>

                <span className="muted">
                  What others are talking about
                </span>
              </div>

              <div className="list-stack">
                {forumPosts.length > 0 ? (
                  forumPosts.map((post) => (
                    <Link
                      key={post.post_id}
                      className="list-item"
                      to={`/forum?post=${post.post_id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <h4>{post.title}</h4>

                      <p className="muted">
                        By {post.user_name || "Unknown"}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="muted">
                    No posts available
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {user.role !== "admin" && user.role !== "patient" && (
        <section className="panel">
          <h3>Quick Start</h3>

          <p className="muted">
            Use Appointments to schedule care, Messages to
            chat with your care team, and Community for posts
            and blogs.
          </p>
        </section>
      )}
    </div>
  );
};

export default Dashboard;

