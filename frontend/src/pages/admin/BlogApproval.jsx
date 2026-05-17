import { useEffect, useState } from "react";
import { blogApi } from "../../utils/apiHelper";
import AppShell from "../../layouts/AppShell";
import { getStoredUser } from "../../utils/session";

const AdminBlogApproval = () => {
  const user = getStoredUser();
  const [pendingArticles, setPendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadPendingArticles();
  }, []);

  const loadPendingArticles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await blogApi.pending();
      setPendingArticles(response.data || []);
    } catch (err) {
      setError("Failed to load pending articles.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (articleId) => {
    try {
      await blogApi.updateStatus(articleId, "active");
      setPendingArticles((prev) =>
        prev.filter((article) => article.article_id !== articleId),
      );
      setSuccessMessage("Article approved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to approve article.");
      console.error(err);
    }
  };

  const handleReject = async (articleId) => {
    try {
      await blogApi.updateStatus(articleId, "deleted");
      setPendingArticles((prev) =>
        prev.filter((article) => article.article_id !== articleId),
      );
      setSuccessMessage("Article rejected successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to reject article.");
      console.error(err);
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
                <h2>Blog Article Approval</h2>

                <p className="muted">
                  Review and approve pending blog articles submitted by users.
                </p>
              </div>

              <span className="page-tag">
                {pendingArticles.length} PENDING
              </span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h3>Pending Articles</h3>
            <p className="muted">Review articles before they go live</p>
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
            <p className="muted">Loading pending articles...</p>
          ) : pendingArticles.length === 0 ? (
            <p className="muted">No pending articles for review.</p>
          ) : (
<<<<<<< HEAD
            <div className="blog-carousel">
              {pendingArticles.map((article) => (
                <div key={article.article_id} className="blog-card" style={{ padding: "20px", minWidth: 360, maxWidth: 420 }}>
=======
            <div className="list-stack">
              {pendingArticles.map((article) => (
                <div key={article.article_id} className="list-item" style={{ 
                  padding: "20px",
                  borderLeft: "4px solid #ffc107"
                }}>
>>>>>>> parent of 42a0ed9 (push)
                  <div style={{ marginBottom: "12px" }}>
                    <h3>{article.title}</h3>
                    <p className="muted">
                      By {article.author_name || "Unknown"} • 
                      {" "}{new Date(article.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{
                    background: "#f8f9fa",
                    padding: "12px",
                    borderRadius: "4px",
                    marginBottom: "12px",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}>
                    <p>{article.body}</p>
                  </div>

                  <div style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}>
                    <button
                      onClick={() => handleApprove(article.article_id)}
                      className="btn-main"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.9em",
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(article.article_id)}
                      className="btn-ghost"
                      style={{
                        padding: "8px 16px",
                        fontSize: "0.9em",
                        color: "#dc3545",
                        borderColor: "#dc3545",
                      }}
                    >
                      ✕ Reject
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

export default AdminBlogApproval;
