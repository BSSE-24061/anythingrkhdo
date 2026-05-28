import { useEffect, useState } from "react";
import { forumApi } from "../../utils/apiHelper";
import AppShell from "../../layouts/AppShell";
import { getStoredUser } from "../../utils/session";

const AdminCommentModeration = () => {
  const user = getStoredUser();
  const [reportedItems, setReportedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadReportedItems();
  }, []);

  const loadReportedItems = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await forumApi.reports();
      setReportedItems(response.data || []);
    } catch (err) {
      setError("Failed to load reported items.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContent = async (postId) => {
    try {
      setError("");
      await forumApi.deletePost(postId);
      await loadReportedItems();
      setSuccessMessage("Content deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete content.");
      console.error(err);
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      setError("");
      await forumApi.dismissReport(reportId);
      await loadReportedItems();
      setSuccessMessage("Report dismissed!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to dismiss report.");
      console.error(err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "#dc3545";
      case "medium":
        return "#ffc107";
      case "low":
        return "#17a2b8";
      default:
        return "#6c757d";
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="dashboard-page">
        <section className="panel hero-panel">
          <div>
            <p className="eyebrow">Content Moderation</p>

            <div className="page-header">
              <div>
                <h2>Comment & Post Moderation</h2>

                <p className="muted">
                  Review reported comments and posts. Remove inappropriate content.
                </p>
              </div>

              <span className="page-tag">
                {reportedItems.length} REPORTED
              </span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h3>Reported Comments & Posts</h3>
            <p className="muted">Review and take action on reported content</p>
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

          {loading ? (
            <p className="muted">Loading reported items...</p>
          ) : reportedItems.length === 0 ? (
            <p className="muted">No reported items. Community is looking good!</p>
          ) : (
            <div className="list-stack">
              {reportedItems.map((item) => (
                <div 
                  key={item.report_id} 
                  className="list-item" 
                  style={{
                    padding: "16px",
                    borderLeft: `4px solid ${getSeverityColor(item.severity)}`,
                    background: "#f8f9fa",
                  }}
                >
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                      <h3>{item.title || "Post/Comment"}</h3>
                      <span
                        style={{
                          background: getSeverityColor(item.severity),
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85em",
                          fontWeight: "bold",
                        }}
                      >
                        {item.severity?.toUpperCase() || "MEDIUM"}
                      </span>
                    </div>

                    <p className="muted" style={{ fontSize: "0.9em", marginBottom: "4px" }}>
                      Reported on: {new Date(item.created_at).toLocaleString()}
                    </p>

                    <p className="muted" style={{ fontSize: "0.85em" }}>
                      Reason: <strong>{item.reason}</strong>
                    </p>

                    {item.description && (
                      <p className="muted" style={{ fontSize: "0.85em" }}>
                        Details: {item.description}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      background: "white",
                      padding: "12px",
                      borderRadius: "4px",
                      marginBottom: "12px",
                      maxHeight: "120px",
                      overflowY: "auto",
                      borderLeft: "3px solid #17a2b8",
                    }}
                  >
                    <p><strong>Content:</strong></p>
                    <p style={{ fontSize: "0.9em" }}>{item.body || "No content available"}</p>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}>
                    <button
                      onClick={() => handleRemoveContent(item.post_id)}
                      className="btn-main"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.9em",
                        background: "#dc3545",
                      }}
                    >
                      ✕ Remove Content
                    </button>
                    <button
                      onClick={() => handleDismissReport(item.report_id)}
                      className="btn-ghost"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.9em",
                      }}
                    >
                      ↺ Dismiss Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
};

export default AdminCommentModeration;
