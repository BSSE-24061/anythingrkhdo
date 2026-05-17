import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogApi } from "../../utils/apiHelper";
import AppShell from "../../layouts/AppShell";
import { getStoredUser } from "../../utils/session";

const AdminCreateBlog = () => {
  const user = getStoredUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    body: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!formData.title.trim() || !formData.body.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        author_user_id: user.id,
        title: formData.title,
        body: formData.body,
        status: "active", // Admin blogs are auto-approved and published immediately
      };

      const response = await blogApi.create(payload);

      setSuccessMessage("Blog published successfully!");
      setFormData({ title: "", body: "" });

      // Redirect to blogs page after 1.5 seconds
      setTimeout(() => {
        navigate("/blogs");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to publish blog. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="dashboard-page">
        <section className="panel hero-panel">
          <div>
            <p className="eyebrow">Content Creation</p>

            <div className="page-header">
              <div>
                <h2>Write New Blog Article</h2>

                <p className="muted">
                  Share insights and information with the community. Your article will be published immediately.
                </p>
              </div>

              <span className="page-tag">ADMIN BLOG</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h3>Create Article</h3>
          </div>

          {successMessage && (
            <div
              style={{
                padding: "12px 16px",
                background: "#d4edda",
                color: "#155724",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #c3e6cb",
              }}
            >
              ✓ {successMessage}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#f8d7da",
                color: "#721c24",
                borderRadius: "4px",
                marginBottom: "20px",
                border: "1px solid #f5c6cb",
              }}
            >
              ✗ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ maxWidth: "800px" }}>
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="title"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Article Title
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter article title"
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "1em",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="body"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Article Content
              </label>
              <textarea
                id="body"
                name="body"
                value={formData.body}
                onChange={handleChange}
                placeholder="Write your article content here..."
                required
                rows={15}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "1em",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <p className="muted" style={{ fontSize: "0.85em", marginTop: "8px" }}>
                {formData.body.length} characters
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => navigate("/blogs")}
                className="btn-ghost"
                disabled={loading}
                style={{ padding: "10px 20px" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-main"
                disabled={loading}
                style={{ padding: "10px 20px" }}
              >
                {loading ? "Publishing..." : "Publish Article"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h3>Tips for Writing Great Articles</h3>
          </div>

          <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
            <li>Use a clear, descriptive title that summarizes your content</li>
            <li>Write for your target audience - use accessible language</li>
            <li>Organize your content with clear sections and paragraphs</li>
            <li>Include practical information and actionable insights</li>
            <li>Review for grammar and spelling before publishing</li>
            <li>Your article will be published immediately as an admin</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
};

export default AdminCreateBlog;
