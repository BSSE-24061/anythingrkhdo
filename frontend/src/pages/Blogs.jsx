import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { blogApi, getErrorMessage } from "../utils/apiHelper";
import { getStoredUser } from "../utils/session";

const Blogs = () => {
    const user = getStoredUser();
    const [blogs, setBlogs] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [mode, setMode] = useState("feed");
    const [userLikes, setUserLikes] = useState(new Set());

    useEffect(() => {
        const loadBlogs = async () => {
            try {
                const [response, bookmarksResponse] = await Promise.all([
                    blogApi.feed(),
                    user?.id ? blogApi.bookmarks(user.id) : Promise.resolve({ data: [] }),
                ]);
                setBlogs(response.data || []);
                setBookmarks(bookmarksResponse.data || []);
            } catch (err) {
                setError(getErrorMessage(err, "Failed to load blogs"));
            } finally {
                setLoading(false);
            }
        };
        loadBlogs();
    }, [user?.id]);

    const bookmarkArticle = async (articleId) => {
        if (!user?.id) return;

        try {
            setError("");
            setNotice("");
            await blogApi.bookmark({ article_id: articleId, user_id: user.id });
            const bookmarksResponse = await blogApi.bookmarks(user.id);
            setBookmarks(bookmarksResponse.data || []);
            setNotice("Article bookmarked.");
        } catch (err) {
            const message = getErrorMessage(err, "Could not bookmark article");
            if (message.toLowerCase().includes("already")) {
                setNotice("This article is already in your bookmarks.");
                return;
            }
            setError(message);
        }
    };

    const removeBookmark = async (articleId) => {
        if (!user?.id) return;

        try {
            setError("");
            setNotice("");
            await blogApi.unbookmark(articleId, user.id);
            const bookmarksResponse = await blogApi.bookmarks(user.id);
            setBookmarks(bookmarksResponse.data || []);
            setNotice("Bookmark removed.");
        } catch (err) {
            setError(getErrorMessage(err, "Could not remove bookmark"));
        }
    };

    const handleBookmarkToggle = (articleId) => {
        if (bookmarkedIds.has(articleId)) {
            removeBookmark(articleId);
        } else {
            bookmarkArticle(articleId);
        }
    };

    const handleLike = async (articleId) => {
        if (!user?.id || userLikes.has(articleId)) return;

        try {
            setError("");
            // Optimistic update
            setUserLikes((prev) => new Set([...prev, articleId]));
            setBlogs((prev) =>
                prev.map((blog) =>
                    blog.article_id === articleId
                        ? { ...blog, likes_count: (blog.likes_count || 0) + 1 }
                        : blog
                )
            );

            // API call in background
            await blogApi.like({ article_id: articleId, user_id: user.id });
            setNotice("Liked!");
        } catch (err) {
            const message = getErrorMessage(err);
            // Revert optimistic update on error
            setUserLikes((prev) => {
                const newSet = new Set(prev);
                newSet.delete(articleId);
                return newSet;
            });
            setBlogs((prev) =>
                prev.map((blog) =>
                    blog.article_id === articleId
                        ? { ...blog, likes_count: Math.max(0, (blog.likes_count || 1) - 1) }
                        : blog
                )
            );

            if (message.toLowerCase().includes("already")) {
                setUserLikes((prev) => new Set([...prev, articleId]));
                setNotice("You already liked this article.");
                return;
            }
            setError(message);
        }
    };

    const bookmarkedIds = new Set(bookmarks.map((bookmark) => bookmark.article_id));
    const visibleBlogs = mode === "bookmarks" ? bookmarks : blogs;

    if (loading) return <div className="content-page"><p>Loading...</p></div>;
    if (error) return <div className="content-page"><p className="error-text">{error}</p></div>;

    return (
        <div className="content-page">
            <section className="panel">
                <h2>Health Blogs</h2>
                <p className="muted">Latest articles and health tips</p>
                <div className="inline-actions" style={{ marginBottom: 12 }}>
                    <button
                        type="button"
                        className={mode === "feed" ? "btn-main small" : "btn-soft small"}
                        onClick={() => setMode("feed")}
                    >
                        Feed
                    </button>
                    <button
                        type="button"
                        className={mode === "bookmarks" ? "btn-main small" : "btn-soft small"}
                        onClick={() => setMode("bookmarks")}
                    >
                        Bookmarks ({bookmarks.length})
                    </button>
                </div>
                {notice && <p className="alert alert-success">{notice}</p>}
                {visibleBlogs.length === 0 ? (
                    <p className="muted">
                        {mode === "bookmarks" ? "No bookmarked blogs yet." : "No blogs available"}
                    </p>
                ) : (
                    <div className="list-stack">
                        {visibleBlogs.map((blog) => (
                            <article key={blog.article_id} className="list-item">
                                <Link
                                    to={`/blogs/${blog.article_id}`}
                                    style={{ color: "inherit", textDecoration: "none" }}
                                >
                                    <h4>{blog.title}</h4>
                                    <p>
                                        {(blog.body || "").substring(0, 220)}
                                        {(blog.body || "").length > 220 ? "..." : ""}
                                    </p>
                                    <div className="stacked-note">
                                        <div>
                                            <strong>Author:</strong> {blog.author_name || "Unknown"}
                                        </div>
                                        <div>
                                            <strong>Published:</strong>{" "}
                                            {blog.published_at
                                                ? new Date(blog.published_at).toLocaleDateString()
                                                : "Draft"}
                                        </div>
                                        <div>
                                            <strong>Likes:</strong> {blog.likes_count || 0}
                                        </div>
                                    </div>
                                </Link>
                                <div className="inline-actions" style={{ marginTop: 12 }}>
                                    <button
                                        type="button"
                                        className="btn-soft small"
                                        onClick={() => handleLike(blog.article_id)}
                                        disabled={userLikes.has(blog.article_id)}
                                        style={{
                                            opacity: userLikes.has(blog.article_id) ? 0.6 : 1,
                                            cursor: userLikes.has(blog.article_id) ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        {userLikes.has(blog.article_id) ? "Liked" : "Like"} - {blog.likes_count || 0}
                                    </button>
                                    <button
                                        type="button"
                                        className={bookmarkedIds.has(blog.article_id) ? "btn-soft small" : "btn-soft small"}
                                        onClick={() => handleBookmarkToggle(blog.article_id)}
                                    >
                                        {bookmarkedIds.has(blog.article_id) ? "Remove Bookmark" : "Bookmark"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Blogs;
