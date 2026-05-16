import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getStoredUser } from "../utils/session";

const Navbar = () => {
  const navigate = useNavigate();
  const user = getStoredUser();

  if (!user) return null;

  const getDashboardLink = () => {
    switch (user.role?.toLowerCase()) {
      case "doctor":
        return { path: "/doctor/dashboard", label: "Dashboard" };
      case "patient":
        return { path: "/patient/dashboard", label: "Dashboard" };
      case "admin":
        return { path: "/admin/dashboard", label: "Dashboard" };
      case "consultant":
        return { path: "/consultant/dashboard", label: "Dashboard" };
      default:
        return { path: "/dashboard", label: "Dashboard" };
    }
  };

  const getLinks = () => {
    const dashboardLink = getDashboardLink();
    const baseLinks = [dashboardLink];

    if (user.role === "patient") {
      return [
        ...baseLinks,
        { path: "/appointments", label: "Appointments" },
        { path: "/specializations", label: "Specializations" },
        { path: "/history", label: "History" },
        { path: "/vitals", label: "Vitals" },
        { path: "/medications", label: "Medications" },
        { path: "/blogs", label: "Blogs" },
        { path: "/forum", label: "Forum" },
        { path: "/chat", label: "Chat" },
        { path: "/consultant", label: "Consultant" },
      ];
    }

    if (user.role === "admin") {
      return [
        ...baseLinks,
        { path: "/blogs", label: "Blogs" },
        { path: "/forum", label: "Forum" },
        { path: "/admin/create-blog", label: "Write Blog" },
        { path: "/admin/blog-approval", label: "Blog Approval" },
        { path: "/admin/comment-moderation", label: "Moderation" },
      ];
    }

    // For doctor and consultant roles, only show dashboard link (sidebar handles other navigation)
    if (user.role?.toLowerCase() === "doctor" || user.role?.toLowerCase() === "consultant") {
      return baseLinks;
    }

    return [
      ...baseLinks,
      { path: "/appointments", label: "Appointments" },
      { path: "/chat", label: "Messages" },
      { path: "/community", label: "Community" },
    ];
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar-left">
        <div className="brand-mark">+</div>
        <div>
          <h1>CareSync</h1>
          <p>{(user.role || "").toUpperCase()} PORTAL</p>
        </div>
      </div>

      <nav className="app-navbar-links">
        {getLinks().map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-navbar-right">
        <div className="user-chip">
          <span>{user.name?.split(" ")[0] || "User"}</span>
        </div>
        <button type="button" className="btn-ghost" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
