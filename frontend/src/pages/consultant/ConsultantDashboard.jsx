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

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;

      setLoading(true);
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

    load();
  }, [user]);

  const unreadNotifications = notifications.filter((entry) => !entry.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  if (!user) return null;

  return (
    <AppShell>
      <div className="dashboard-page">
        <section className="panel hero-panel">
          <div>
            <p className="eyebrow">Dashboard</p>

            <div className="page-header">
              <div>
                <h2>Welcome, {user.name || "Consultant"}</h2>

                <p className="muted">
                  Manage consultations, respond to messages, and collaborate with patients.
                </p>
              </div>

              <span className="page-tag">CONSULTANT</span>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <p>Unread Alerts</p>
                <h3>{loading ? "..." : unread}</h3>
              </article>

              <article className="stat-card">
                <p>Messages</p>
                <h3>{loading ? "..." : unreadNotifications}</h3>
              </article>

              <article className="stat-card">
                <p>Patients</p>
                <h3>{loading ? "..." : patients.length}</h3>
              </article>

              <article className="stat-card">
                <p>Notifications</p>
                <h3>{loading ? "..." : unreadNotifications}</h3>
              </article>
            </div>
          </div>

          <div className="mini-stats">
            <div className="card">
              <h3>Consultation Hub</h3>

              <p className="muted">
                Manage your consultations, review patient cases, and provide 
                expert guidance through our platform.
              </p>
            </div>

            <div className="card">
              <h3>Quick Actions</h3>

              <div className="action-grid">
                <Link to="/chat" className="action-card btn-main">
                  Messages
                </Link>

                <Link to="/blogs" className="action-card btn-ghost">
                  Blogs & Articles
                </Link>

                <Link to="/forum" className="action-card btn-ghost">
                  Community Forum
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="grid-layout two-col">
          <section className="panel">
            <div className="section-heading">
              <h3>Recent Notifications</h3>
              <span className="muted">Latest platform updates</span>
            </div>

            {recentNotifications.length ? (
              <div className="list-stack">
                {recentNotifications.map((notification) => (
                  <div className="list-item" key={notification.notification_id}>
                    <strong>{notification.title}</strong>
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    <p>{notification.body || "No details provided"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No recent notifications.</p>
            )}
          </section>

          <section className="panel">
            <div className="section-heading">
              <h3>Recent Alerts</h3>
              <span className="muted">Monitor alerts</span>
            </div>

            {alerts.length ? (
              <div className="list-stack">
                {alerts.slice(0, 5).map((alert) => (
                  <div className="list-item" key={alert.alert_id}>
                    <strong>{alert.alert_type}</strong>
                    <span>{alert.severity}</span>
                    <p>{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No recent alerts.</p>
            )}
          </section>
        </div>

        <div className="grid-layout two-col">
          <section className="panel">
            <div className="section-heading">
              <h3>Latest Blogs</h3>
              <span className="muted">Share expertise with community</span>
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
                    <p className="muted">By {blog.author_name || "Unknown"}</p>
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
              <span className="muted">Engage with the community</span>
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
                    <p className="muted">By {post.user_name || "Unknown"}</p>
                  </Link>
                ))
              ) : (
                <p className="muted">No posts available</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
};

export default ConsultantDashboard;
