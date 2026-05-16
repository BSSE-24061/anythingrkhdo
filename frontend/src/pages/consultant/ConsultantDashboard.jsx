import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  notificationApi,
  userApi,
  vitalApi,
  blogApi,
  forumApi,
} from "../../utils/apiHelper";
import { getStoredUser } from "../../utils/session";
import AppShell from "../../layouts/AppShell";

const ConsultantDashboard = () => {
  const user = useMemo(() => getStoredUser(), []);

  const [unread, setUnread] = useState(0);
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) return;
    try {
      const [
        unreadRes,
        usersRes,
        alertsRes,
        notificationsRes,
        blogsRes,
        forumRes,
      ] = await Promise.all([
        notificationApi.unreadCount(user.id),
        userApi.list(),
        vitalApi.alerts(user.id),
        notificationApi.list(user.id),
        blogApi.feed(),
        forumApi.feed(),
      ]);

      setUnread(unreadRes.data.unread_count || 0);
      setPatients((usersRes.data || []).filter((entry) => entry.role === "patient"));
      setAlerts(alertsRes.data || []);
      setNotifications(notificationsRes.data || []);
      setBlogs(blogsRes.data || []);
      setForumPosts(forumRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadNotifications = notifications.filter((entry) => !entry.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  if (!user) return null;

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 16 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 32, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Welcome, {user.name || "Consultant"}
          </h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontWeight: 600, fontSize: 18 }}>
            Manage consultations, respond to messages, and collaborate.
          </p>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Unread Alerts</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{loading ? "..." : unread}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>⚠️</div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Messages</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{loading ? "..." : unreadNotifications}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>💬</div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Patients</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{loading ? "..." : patients.length}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>👥</div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 14, padding: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#475569", fontWeight: 800, fontSize: 14 }}>Notifications</div>
              <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 22 }}>{loading ? "..." : unreadNotifications}</div>
            </div>
            <div style={{ color: "#2563eb", fontWeight: 900 }}>🔔</div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
          {/* Left Column */}
          <div style={{ display: "grid", gap: 16 }}>
            <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Recent Notifications</h3>
              </div>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {recentNotifications.length > 0 ? (
                  recentNotifications.map((notification) => (
                    <div key={notification.notification_id} style={{ border: "1px solid #e6edf5", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.22)", display: "grid", placeItems: "center", color: "#2563eb", fontWeight: 900 }}>🔔</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{notification.title}</div>
                          <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>{notification.body || "No details provided"}</div>
                          <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11, marginTop: 6 }}>{new Date(notification.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No recent notifications</div>
                )}
              </div>
            </section>

            <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18 }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Latest Blogs</h3>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {blogs.length > 0 ? (
                  blogs.slice(0, 3).map((blog) => (
                    <Link key={blog.article_id} to={`/blogs/${blog.article_id}`} style={{ textDecoration: "none", border: "1px solid #e6edf5", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.22)", display: "grid", placeItems: "center", color: "#2563eb", fontWeight: 900 }}>📝</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{blog.title}</div>
                          <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>By {blog.author_name || "Unknown"}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No blogs available</div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div style={{ display: "grid", gap: 16 }}>
            <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18, height: "fit-content", position: "sticky", top: 20 }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Recent Alerts</h3>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert) => (
                    <div key={alert.alert_id} style={{ border: "1px solid #e6edf5", borderRadius: 14, padding: 12, background: "#fff", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ fontSize: 18, lineHeight: 1 }}>⚠️</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{alert.alert_type}</div>
                        <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12, marginTop: 4 }}>{alert.message}</div>
                        <div style={{ color: "#94a3b8", fontWeight: 800, fontSize: 11, marginTop: 6 }}>{alert.severity}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No recent alerts</div>
                )}
              </div>
            </section>

            <section style={{ background: "#ffffff", border: "1px solid #e6edf5", borderRadius: 16, padding: 18 }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Community Posts</h3>
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {forumPosts.length > 0 ? (
                  forumPosts.slice(0, 3).map((post) => (
                    <Link key={post.post_id} to={`/forum?post=${post.post_id}`} style={{ textDecoration: "none", border: "1px solid #e6edf5", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#0f172a", fontWeight: 900, fontSize: 13 }}>{post.title}</div>
                          <div style={{ color: "#64748b", fontWeight: 700, fontSize: 12 }}>By {post.user_name || "Unknown"}</div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>No posts available</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ConsultantDashboard;
