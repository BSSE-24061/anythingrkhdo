import { useMemo, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser } from "../utils/session";
import { chatApi } from "../utils/apiHelper";

const ADMIN_NAV = [
  ["Dashboard", "/admin/dashboard"],
  ["Blogs", "/blogs"],
  ["Forum", "/forum"],
  ["Blog Approval", "/admin/blog-approval"],
  ["Comment Moderation", "/admin/comment-moderation"],
  ["Create Blog", "/admin/create-blog"],
];

const CONSULTANT_NAV = [
  ["Dashboard", "/consultant/dashboard"],
  ["Chat", "/chat"],
  ["Blogs", "/blogs"],
  ["Forum", "/forum"],
];

const AppShell = ({ children }) => {
  const user = useMemo(() => getStoredUser(), []);
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBadges = async () => {
      try {
        const chatRes = await chatApi.inbox(user.id);
        const unreadRooms = (chatRes.data || []).filter(
          (r) => r.unread_count > 0,
        ).length;
        setUnreadChats(unreadRooms);
      } catch (err) {
        console.error("Failed to load badges:", err);
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  if (!user) return null;

  const role = user.role?.toLowerCase() || "";
  const navItems =
    role === "admin" ? ADMIN_NAV : role === "consultant" ? CONSULTANT_NAV : [];

  return (
    <div
      className="patient-theme"
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
      }}
    >
      <aside
        style={{
          width: 248,
          background: "#ffffff",
          borderRight: "1px solid #e6edf5",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/small%20logo.png"
            alt="MediCare logo"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              objectFit: "contain",
              background: "#fff",
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
            }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 14 }}>
              MediCare
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: "#64748b",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {role}
            </div>
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 8,
          }}
        >
          {navItems.map(([label, path]) => {
            const active =
              location.pathname === path ||
              (path !== `/${role}/dashboard` &&
                location.pathname.startsWith(path));
            return (
              <Link
                key={path + label}
                to={path}
                style={{
                  padding: "12px 12px",
                  borderRadius: 12,
                  color: active ? "#1d4ed8" : "#334155",
                  fontWeight: 800,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: active
                    ? "rgba(37, 99, 235, 0.08)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(37, 99, 235, 0.25)"
                    : "1px solid transparent",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: active ? "#2563eb" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {label}
                </span>
                {label === "Chat" && unreadChats > 0 && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 900,
                      padding: "2px 6px",
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {unreadChats}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            border: "1px solid #e6edf5",
            borderRadius: 16,
            padding: 12,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {role}
          </div>
          <div
            style={{
              fontWeight: 900,
              color: "#0f172a",
              marginTop: 6,
              fontSize: 14,
            }}
          >
            {user.name || "User"}
          </div>

          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px",
              borderRadius: 12,
              border: "1px solid #fee2e2",
              background: "#fef2f2",
              color: "#dc2626",
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Log Out
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: 24,
          overflow: "auto",
          maxWidth: "calc(100vw - 248px)",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default AppShell;
